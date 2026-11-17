import { type IActivityHandler } from '@vertigis/workflow/IActivityHandler'
import { type ProgramInspector } from '@vertigis/workflow/definition/ProgramInspector'
import { type Reference } from '@vertigis/workflow/definition/Reference'
import { type FormElementRegistration } from '@vertigis/workflow/index'
import { type IActivityHandlerFactory } from '@vertigis/workflow/execution/Engine'
import * as main from '@vertigis/workflow/activities/main'
import { registerModuleName, importModule } from './CustomModuleLoader'
import { loadLocalCustomActivities } from '../activities'
import { localCustomActivityPackSuites } from '../activities/customActivityPackManifest'

// Represents the type of the main module for custom activities.
export type CustomActivityMainModuleType = {
  main: (_: any, options: Options) => Promise<void>
}

// Models activity classes that the loader can pickup.
interface ActivityHandlerClass extends Function {
  new (): IActivityHandler

  prototype: IActivityHandler

  action?: string

  suite?: string
}

interface ActivityHandlerClassRef {
  factory?: ActivityHandlerClass

  promise?: Promise<void>

  suite: string

  path: string
}

interface Options {
  action?: string

  suite?: string
}

let activityCache: {
  [action: string]: ActivityHandlerClassRef[]
} = {}

let modules: {
  [path: string]: {}
} = {}

// Cache the form elements so they're available during subsequent runs. A new
// instance of Engine will be created each time. Activity packs are only loaded
// once and their result is cached for both activities (ActivityLoader) and
// elements (here).
let formElementCache: Record<string, FormElementRegistration<any>> = {}

export function getCachedFormElements(): typeof formElementCache {
  return { ...formElementCache }
}

const httpPrefix = 'http://'
const httpsPrefix = 'https://'
function isHttp(path: string) {
  // Attempt figure out this path is a full URL.
  if (path.substring(0, httpPrefix.length) === httpPrefix) {
    return true
  }

  // Attempt figure out this path is a full URL.
  if (path.substring(0, httpsPrefix.length) === httpsPrefix) {
    return true
  }

  return false
}

function isLocalCustomActivityPack(suite: string) {
  return localCustomActivityPackSuites.includes(suite)
}

function importRef(path: string, options: Options) {
  if (isLocalCustomActivityPack(options.suite)) {
    return loadLocalCustomActivities(options)
  }
  if (isHttp(path)) {
    // We must map the path to a prefix.
    const moduleName = registerModuleName(path)
    const newPath = path.endsWith('/') ? path + 'main.js' : path + '/main.js'
    return importModule(newPath, options, moduleName)
  }
  if (path.endsWith('/')) {
    return (main as CustomActivityMainModuleType).main(null, options)
  }
  return importModule('../activities/' + path, options)
}

function exportIsFormElementRegistration(
  moduleExport: FormElementRegistration
): moduleExport is FormElementRegistration {
  if (typeof moduleExport === 'object' && !!moduleExport.component) {
    return true
  }

  return false
}

// Ensures we have an actual activity class.
function exportIsActivity(
  moduleExport: ActivityHandlerClass | FormElementRegistration
): moduleExport is ActivityHandlerClass {
  if (typeof moduleExport !== 'function') {
    return false
  }

  const prototype = moduleExport.prototype
  if (typeof prototype !== 'object' || prototype === null) {
    return false
  }

  if (typeof prototype.execute !== 'function') {
    return false
  }

  if (typeof moduleExport.action !== 'string') {
    return false
  }

  if (typeof moduleExport.suite !== 'string') {
    return false
  }

  return true
}

async function loadRef(
  action: string,
  path: string,
  suite: string,
  registerFormElement: (registration: FormElementRegistration) => void
) {
  // Attempt to import and consume the exports of the module.
  const exports = await importRef(path, { action, suite })
  if (typeof exports === 'object' && exports !== null && modules[path] !== exports) {
    modules[path] = exports

    for (const name in exports) {
      const moduleExport = (
        exports as Record<string, ActivityHandlerClass | FormElementRegistration>
      )[name]
      if (exportIsActivity(moduleExport)) {
        // Back fill anything we find.
        createRef(moduleExport.action, path, moduleExport.suite, registerFormElement, moduleExport)
      } else if (exportIsFormElementRegistration(moduleExport)) {
        formElementCache[moduleExport.id] = moduleExport
        registerFormElement(moduleExport)
      }
    }
  }
}

// Attempts to find an handler given certain criteria.
function createRef(
  action: string,
  path: string,
  suite: string,
  registerFormElement: (registration: FormElementRegistration) => void,
  factory?: ActivityHandlerClass
) {
  let refs = activityCache[action]
  if (refs === undefined) {
    refs = activityCache[action] = []
  }

  for (const ref of refs) {
    if (ref.path === path && ref.suite === suite) {
      if (factory !== undefined) {
        ref.factory = factory
      }

      return ref
    }
  }

  const ref: ActivityHandlerClassRef = {
    factory,
    path,
    suite
  }

  refs.push(ref)

  if (factory !== undefined) {
    ref.factory = factory
  } else {
    ref.promise = loadRef(action, path, suite, registerFormElement)
  }

  return ref
}

// Used to asynchronously resolve.
async function resolveRef(refs: ActivityHandlerClassRef[]) {
  for (const ref of refs) {
    await ref.promise
    ref.promise = undefined

    if (ref.factory !== undefined) {
      return new ref.factory()
    }
  }
}

/** Implements a methodology for loading activity handlers using the module loader. */
export class ActivityLoader implements IActivityHandlerFactory {
  static defaultReference: Reference = {
    path: '@vertigis/workflow/runtime/activities/',
    suite: 'gcx:wf:builtin'
  }

  constructor() {
    formElementCache = {}
    activityCache = {}
    modules = {}
  }

  /** The default references. */
  references: Reference[] = []

  /**
   * Creates an activity handler.
   * @param action
   * @param inspector
   */
  create(
    action: string,
    registerFormElement: (registration: FormElementRegistration) => void,
    inspector?: ProgramInspector
  ): PromiseLike<IActivityHandler> | IActivityHandler {
    if (typeof action !== 'string') {
      return undefined
    }

    // Try to synchronously find a handler.
    let list: ActivityHandlerClassRef[]
    function create(references: Reference[]) {
      for (const reference of references) {
        const path = reference.path
        const suite = reference.suite
        const ref = createRef(action, path, suite, registerFormElement)
        if (list === undefined) {
          if (ref.factory !== undefined) {
            return new ref.factory()
          }

          if (ref.promise !== undefined) {
            list = [ref]
          }
        } else {
          list.push(ref)
        }
      }
    }

    if (inspector !== undefined) {
      const handler = create(inspector.program.references)
      if (handler !== undefined) {
        return handler
      }
    }

    const handler = create(this.references)
    if (handler !== undefined) {
      return handler
    }

    // Can't so switch to async.
    return list !== undefined ? resolveRef(list) : undefined
  }
}
