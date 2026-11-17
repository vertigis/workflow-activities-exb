/*
    Loads AMD modules, such as custom activity packs built with the VertiGIS
    Studio Workflow SDK, at runtime. Experience Builder has no AMD loader, so
    a global `define` is installed only while scripts from this loader load.
    It is kept out of the way of other scripts:
    - It is not enumerable, so SystemJS does not take it as the export of a
      global script that loads at the same time.
    - `define.amd` is only visible to scripts from this loader, so UMD
      libraries that load at the same time do not register with it.
    - Calls from other scripts go to the previous `define`, if there was one.
*/

/** Gives the value of a dependency that is not a URL or a special AMD module. */
export type AmdDependencyResolver = (id: string, url: string) => unknown

interface Definition {
  dependencies: string[]
  factory: unknown
}

type Define = ((...args: unknown[]) => void) & { amd?: unknown }

const amdFeatures = {}

// The define calls made by each script that this loader added, until the
// script has loaded.
const pendingScripts = new Map<HTMLScriptElement, Definition[]>()

const loadedModules = new Map<string, Promise<unknown>>()

let installCount = 0
let previousDefine: PropertyDescriptor | undefined

function getPreviousDefine(): Define | undefined {
  const value = previousDefine?.get ? previousDefine.get.call(window) : previousDefine?.value
  return typeof value === 'function' ? value : undefined
}

function getPendingDefinitions(): Definition[] | undefined {
  const script = document.currentScript
  return script instanceof HTMLScriptElement ? pendingScripts.get(script) : undefined
}

function parseDefineArguments(args: unknown[]): Definition {
  // define(id?, dependencies?, factory). The id is not needed, because a
  // module is identified by its URL.
  const rest = typeof args[0] === 'string' ? args.slice(1) : args
  if (Array.isArray(rest[0])) {
    return { dependencies: rest[0] as string[], factory: rest[1] }
  }
  const factory = rest[0]
  // A factory without dependencies gets the CommonJS arguments it declares.
  const dependencies =
    typeof factory === 'function' ? ['require', 'exports', 'module'].slice(0, factory.length) : []
  return { dependencies, factory }
}

const define: Define = function (this: unknown, ...args: unknown[]) {
  const definitions = getPendingDefinitions()
  if (definitions) {
    definitions.push(parseDefineArguments(args))
    return
  }
  const previous = getPreviousDefine()
  if (previous) {
    return previous.apply(this, args)
  }
  console.warn('Ignored an AMD define call from a script that is not a Workflow activity pack.')
}
Object.defineProperty(define, 'amd', {
  get: () => (getPendingDefinitions() ? amdFeatures : getPreviousDefine()?.amd)
})

function installDefine() {
  if (installCount++ > 0) {
    return
  }
  previousDefine = Object.getOwnPropertyDescriptor(window, 'define')
  if (previousDefine && !previousDefine.configurable) {
    // For example a global declared with var. It can only be assigned.
    ;(window as any).define = define
    return
  }
  Object.defineProperty(window, 'define', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: define
  })
}

function uninstallDefine() {
  if (--installCount > 0) {
    return
  }
  // Leave it if another script replaced define in the meantime.
  if ((window as any).define === define) {
    if (!previousDefine) {
      delete (window as any).define
    } else if (previousDefine.configurable) {
      Object.defineProperty(window, 'define', previousDefine)
    } else {
      ;(window as any).define = previousDefine.value
    }
  }
  previousDefine = undefined
}

function loadScript(url: string): Promise<Definition[]> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const definitions: Definition[] = []
    const cleanUp = () => {
      script.onload = null
      script.onerror = null
      pendingScripts.delete(script)
      script.remove()
      uninstallDefine()
    }
    script.async = true
    script.src = url
    script.onload = () => {
      cleanUp()
      resolve(definitions)
    }
    script.onerror = () => {
      cleanUp()
      reject(new Error(`Unable to load ${url}.`))
    }
    pendingScripts.set(script, definitions)
    installDefine()
    document.head.appendChild(script)
  })
}

function resolveId(id: string, url: string, resolveDependency: AmdDependencyResolver) {
  if (/^\.\.?\//.test(id)) {
    const path = id.endsWith('.js') ? id : `${id}.js`
    return loadAmdModule(new URL(path, url).href, resolveDependency)
  }
  if (/^https?:\/\//.test(id)) {
    return loadAmdModule(id, resolveDependency)
  }
  return resolveDependency(id, url)
}

function createRequire(
  url: string,
  resolveDependency: AmdDependencyResolver,
  resolved: Map<string, unknown>
) {
  const require = (
    ids: string | string[],
    callback?: (...values: unknown[]) => void,
    errback?: (error: unknown) => void
  ) => {
    if (typeof ids === 'string') {
      // Synchronous require only works for modules that are already loaded.
      if (!resolved.has(ids)) {
        throw new Error(`Module '${ids}' is not loaded. Use require([...], callback) instead.`)
      }
      return resolved.get(ids)
    }
    Promise.all(ids.map(id => resolveId(id, url, resolveDependency))).then(
      values => {
        callback?.(...values)
      },
      error => {
        if (errback) {
          errback(error)
        } else {
          console.error(error)
        }
      }
    )
  }
  require.toUrl = (path: string) => new URL(path, url).href
  return require
}

async function instantiate(
  definition: Definition,
  url: string,
  resolveDependency: AmdDependencyResolver
) {
  const module = { id: url, uri: url, exports: {}, config: () => ({}) }
  const resolved = new Map<string, unknown>()
  const require = createRequire(url, resolveDependency, resolved)
  const values = await Promise.all(
    definition.dependencies.map(id => {
      switch (id) {
        case 'require':
          return require
        case 'exports':
          return module.exports
        case 'module':
          return module
        default:
          return resolveId(id, url, resolveDependency)
      }
    })
  )
  definition.dependencies.forEach((id, index) => resolved.set(id, values[index]))

  const { factory } = definition
  const result = typeof factory === 'function' ? factory.apply(module.exports, values) : factory
  return result !== undefined ? result : module.exports
}

async function loadAndInstantiate(url: string, resolveDependency: AmdDependencyResolver) {
  const definitions = await loadScript(url)
  if (definitions.length === 0) {
    throw new Error(
      `${url} did not define an AMD module. Make sure it is an activity pack built with the VertiGIS Studio Workflow SDK, and look for script errors in the browser console.`
    )
  }
  return instantiate(definitions[0], url, resolveDependency)
}

/**
 * Loads the AMD module at a URL with a script element, and gives its exports.
 * Each URL is loaded only once. If it fails, the next call tries again.
 * @param url The URL of the module's script.
 * @param resolveDependency Gives the value of each dependency that is not a
 * URL, a relative path, or one of `require`, `exports` and `module`.
 */
export function loadAmdModule(url: string, resolveDependency: AmdDependencyResolver) {
  let module = loadedModules.get(url)
  if (!module) {
    module = loadAndInstantiate(url, resolveDependency)
    loadedModules.set(url, module)
    module.catch(() => loadedModules.delete(url))
  }
  return module
}
