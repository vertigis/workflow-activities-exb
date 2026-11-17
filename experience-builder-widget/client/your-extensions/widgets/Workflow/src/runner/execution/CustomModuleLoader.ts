import * as main from '@vertigis/workflow/activities/main'

import { Task } from '@vertigis/workflow/Task'
import { loadAmdModule } from './AmdModuleLoader'
import { CustomActivityMainModuleType } from './CustomActivityLoader'
import { resolveActivityPackDependency } from './activityPackDependencies'

declare const require: Function

/*
    Custom activity packs are AMD modules. They are loaded from their URL at
    runtime by AmdModuleLoader.
*/

/** Defines the loader which is passed into the main method of an activity pack. */
export type Loader = (path: string, require: Function, callback?: Function) => PromiseLike<{}>

/** Defines the module which may contain a main method. */
export interface Module {
  main?: (load: Loader, options: {}, prefix: string) => PromiseLike<{}> | {}
}

/** Defines the concept of a global scope. */
export interface Global {
  /** RequireJS compatible define method. */
  define: Function

  /** RequireJS compatible require method. */
  require: Function

  /** A+ Promise compatible class. */
  Promise: PromiseConstructor
}

/** Exposes the global object. */
export const global: Global = new Function('return this')()

if (typeof global.Promise !== 'function') {
  global.Promise = <any>Promise
}

const requireDefault = require

/**
 * Loads a module using the base module loader.
 * @param path The path to load.
 * @param require The require method to use.
 * @param callback The callback to invoke.
 */
export async function load(path: string, require?: Function, callback?: Function) {
  if (typeof require !== 'function') {
    require = requireDefault
  }
  const task = new Task<Module>(function (resolve, reject) {
    const loading = loadAmdModule(toUrl(path), resolveActivityPackDependency) as Promise<Module>
    loading.then(module => {
      resolve(module)

      if (typeof callback === 'function') {
        callback(module)
      }
    }, reject)
  })

  return task
}

let nextId = 0
/**
 * A set of module names where the property name
 * is an external URL and the value is a module name
 * that stands for that URL.
 */
const moduleNames: Record<string, string> = {}

/** The URL of each module name in moduleNames. */
const moduleUrls: Record<string, string> = {}

/**
 * Gives the URL of a module path. A path that starts with a registered
 * module name is relative to the URL of that module name.
 * @param path The path of a module, or a URL.
 */
function toUrl(path: string) {
  const moduleName = Object.keys(moduleUrls).find(name => path.startsWith(`${name}/`))
  if (moduleName === undefined) {
    return path
  }
  const url = moduleUrls[moduleName] + path.substring(moduleName.length)
  return url.endsWith('.js') ? url : `${url}.js`
}

/**
 * Adds a unique module name for the given url, so that
 * dependencies can be loaded relative to it.
 * @param url The url of an external module.
 */
export function registerModuleName(url: string) {
  let moduleName = moduleNames[url]

  if (moduleName !== undefined) {
    return moduleName
  }

  moduleName = `@vertigis/workflow/externals/ext-${nextId++}`
  // Make sure we don't have a path ending with "/" or else dependent modules will all be loaded
  // from urls containing "//" where there should be only "/".
  moduleUrls[moduleName] = url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url

  return (moduleNames[url] = moduleName)
}

/**
 * Performs module loading.
 * @param path The path to load (not a URL).
 * @param options The options to send.
 * @param prefix The prefix as it is understood.
 */
export async function importModule(path: string, options: {}, prefix?: string): Promise<{}> {
  let module
  if (prefix) {
    module = await load(path)
  } else {
    module = await (main as CustomActivityMainModuleType).main(null, options)
  }
  const moduleMain = (module as Module | undefined)?.main
  if (typeof moduleMain === 'function') {
    return await moduleMain.call(global, load, options, prefix)
  }

  return typeof module === 'object' && module !== null ? module : {}
}
