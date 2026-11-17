import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { loadArcGISJSAPIModules } from 'jimu-core'

interface WebpackContext {
  (key: string): unknown
  keys: () => string[]
}

declare const require: {
  context: (
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp,
    mode?: 'sync' | 'weak'
  ) => WebpackContext
}

interface SharedPackage {
  /** The names that activity packs use for the package, longest first. */
  names: string[]
  modules: WebpackContext
  keys: Set<string>
}

function sharePackage(names: string[], modules: WebpackContext): SharedPackage {
  return { names, modules, keys: new Set(modules.keys()) }
}

// The modules of the VertiGIS packages that the Workflow SDK leaves out of
// activity packs. Activity packs must get the same module instances that this
// widget uses. For example, `activate(MapProvider)` only finds the map
// provider that the widget registers if it gets the same MapProvider class,
// and React UI components only get the widget's theme from its own copy of
// React UI.
// - All modules of the Workflow runtime and React UI are bundled. React UI's
//   Moment adapter is left out, because Experience Builder treats moment as
//   an external that it does not supply, so the widget would not load.
// - Only the ArcGIS Extensions modules that the widget already uses are
//   supplied ('weak'). Bundling all of them would add about 2.6 MB and 60
//   ArcGIS Maps SDK modules that load when the widget starts.
// The `require.context` arguments must be literals, so the patterns that
// leave out nested node_modules are repeated.
const sharedPackages = [
  sharePackage(
    [
      '@vertigis/workflow/runtime',
      '@geocortex/workflow/runtime',
      '@vertigis/workflow',
      '@geocortex/workflow'
    ],
    require.context('@vertigis/workflow', true, /^(?!.*\/node_modules\/).*\.js$/)
  ),
  sharePackage(
    ['@vertigis/react-ui'],
    require.context(
      '@vertigis/react-ui',
      true,
      /^(?!.*\/node_modules\/)(?!.*\/AdapterMoment\/).*\.js$/
    )
  ),
  sharePackage(
    ['@vertigis/arcgis-extensions'],
    require.context('@vertigis/arcgis-extensions', true, /^(?!.*\/node_modules\/).*\.js$/, 'weak')
  )
]

/** Gives a module of a context, or undefined if a weak context does not have it. */
function requireModule(modules: WebpackContext, key: string): unknown {
  try {
    return modules(key)
  } catch (error) {
    if ((error as { code?: unknown } | null)?.code === 'MODULE_NOT_FOUND') {
      return undefined
    }
    throw error
  }
}

const arcgisPrefixes = ['@arcgis/core/', 'esri/']

const sharedModules: Record<string, unknown> = {
  react: React,
  'react-dom': ReactDOM
}

function getPackageModule(id: string): unknown {
  for (const { names, modules, keys } of sharedPackages) {
    const name = names.find(n => id === n || id.startsWith(`${n}/`))
    if (name === undefined) {
      continue
    }
    const path = id.substring(name.length + 1).replace(/\.js$/, '')
    const candidates = path ? [`./${path}.js`, `./${path}/index.js`] : ['./index.js']
    const key = candidates.find(k => keys.has(k))
    return key !== undefined ? requireModule(modules, key) : undefined
  }
  return undefined
}

/**
 * Gives the module in the same form as other Experience Builder externals: a
 * copy of the module namespace that is marked as an ES module.
 */
function toEsModule(module: unknown) {
  if (
    typeof module === 'object' &&
    module !== null &&
    (module as Record<symbol, unknown>)[Symbol.toStringTag] === 'Module'
  ) {
    return Object.defineProperty({ ...module }, '__esModule', { value: true })
  }
  return module
}

async function getArcGISModule(id: string): Promise<unknown> {
  const prefix = arcgisPrefixes.find(p => id.startsWith(p))
  if (prefix === undefined) {
    return undefined
  }
  const [module] = await loadArcGISJSAPIModules([`esri/${id.substring(prefix.length)}`])
  return module != null ? toEsModule(module) : undefined
}

/**
 * Gives the modules that the VertiGIS Studio Workflow SDK leaves out of
 * activity packs: the Workflow runtime, React UI, the ArcGIS Maps SDK for
 * JavaScript, React, and the ArcGIS Extensions modules that the widget uses
 * itself.
 * @param id The name of the module.
 * @param url The URL of the module that depends on it.
 */
export async function resolveActivityPackDependency(id: string, url: string): Promise<unknown> {
  const module = sharedModules[id] ?? getPackageModule(id) ?? (await getArcGISModule(id))
  if (module === undefined) {
    throw new Error(
      `Unable to load the activity pack at ${url}: the Workflow widget cannot supply its dependency '${id}'. The widget supplies the VertiGIS Studio Workflow runtime, VertiGIS Studio React UI, the ArcGIS Maps SDK for JavaScript, React, and the VertiGIS Studio ArcGIS Extensions modules that the widget uses itself.`
    )
  }
  return module
}
