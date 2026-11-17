import { loadAmdModule } from '../src/runner/execution/AmdModuleLoader'

type Define = ((...args: any[]) => void) & { amd?: unknown }
type ScriptBody = (define: Define) => void

const baseUrl = 'https://packs.example.com/'

// Script bodies by URL. A script without a body fails to load.
const scripts = new Map<string, ScriptBody | undefined>()
const appendedUrls: string[] = []

let currentScript: HTMLScriptElement | null = null
const otherScript = document.createElement('script')

function withCurrentScript(script: HTMLScriptElement, callback: () => void) {
  const previous = currentScript
  currentScript = script
  try {
    callback()
  } finally {
    currentScript = previous
  }
}

function serve(path: string, body?: ScriptBody) {
  scripts.set(baseUrl + path, body)
  return baseUrl + path
}

beforeAll(() => {
  Object.defineProperty(document, 'currentScript', { configurable: true, get: () => currentScript })
})

beforeEach(() => {
  scripts.clear()
  appendedUrls.length = 0
  jest.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (!(node instanceof HTMLScriptElement) || !scripts.has(node.src)) {
      return Node.prototype.appendChild.call(document.head, node)
    }
    // Run the script asynchronously, as the browser does.
    appendedUrls.push(node.src)
    const body = scripts.get(node.src)
    setTimeout(() => {
      if (!body) {
        node.dispatchEvent(new Event('error'))
        return
      }
      withCurrentScript(node, () => body((window as any).define))
      node.dispatchEvent(new Event('load'))
    })
    return node
  })
})

afterEach(() => {
  jest.restoreAllMocks()
  delete (window as any).define
})

describe('loadAmdModule', () => {
  it('runs the factory with the resolved dependencies', async () => {
    const url = serve('dependencies/main.js', define =>
      define(['a', 'b'], (a: unknown, b: unknown) => ({ a, b }))
    )
    const resolve = jest.fn(async (id: string) => ({ id }))

    await expect(loadAmdModule(url, resolve)).resolves.toEqual({ a: { id: 'a' }, b: { id: 'b' } })
    expect(resolve).toHaveBeenCalledWith('a', url)
    expect(resolve).toHaveBeenCalledWith('b', url)
  })

  it('supplies require, exports and module', async () => {
    const url = serve('special/main.js', define =>
      define(['require', 'exports', 'module', 'a'], (require: any, exports: any, module: any) => {
        exports.value = require('a')
        exports.uri = module.uri
        exports.asset = require.toUrl('./image.png')
      })
    )

    await expect(loadAmdModule(url, () => 42)).resolves.toEqual({
      value: 42,
      uri: url,
      asset: `${baseUrl}special/image.png`
    })
  })

  it('gives a factory without dependencies the CommonJS arguments it declares', async () => {
    const url = serve('commonjs/main.js', define =>
      define((require: unknown, exports: any) => {
        exports.loaded = true
      })
    )

    await expect(loadAmdModule(url, jest.fn())).resolves.toEqual({ loaded: true })
  })

  it('loads relative dependencies from the location of the module', async () => {
    serve('relative/helper.js', define => define([], () => 'helper'))
    const url = serve('relative/main.js', define =>
      define(['./helper'], (helper: string) => `main uses ${helper}`)
    )

    await expect(loadAmdModule(url, jest.fn())).resolves.toBe('main uses helper')
  })

  it('loads each URL only once', async () => {
    const url = serve('once/main.js', define => define([], () => ({})))
    const resolve = jest.fn()

    const [first, second] = await Promise.all([loadAmdModule(url, resolve), loadAmdModule(url, resolve)])
    const third = await loadAmdModule(url, resolve)

    expect(first).toBe(second)
    expect(first).toBe(third)
    expect(appendedUrls).toEqual([url])
  })

  it('keeps define away from other scripts', async () => {
    let enumerable: boolean
    let ownAmd: unknown
    let otherAmd: unknown
    const url = serve('isolation/main.js', define => {
      enumerable = Object.keys(window).includes('define')
      ownAmd = define.amd
      withCurrentScript(otherScript, () => {
        otherAmd = define.amd
      })
      define([], () => 'pack')
    })

    await expect(loadAmdModule(url, jest.fn())).resolves.toBe('pack')
    expect(enumerable).toBe(false)
    expect(ownAmd).toBeTruthy()
    expect(otherAmd).toBeUndefined()
    expect('define' in window).toBe(false)
  })

  it('sends define calls from other scripts to the previous define', async () => {
    const previous: Define = jest.fn()
    previous.amd = { previous: true }
    ;(window as any).define = previous
    const factory = () => 'other'
    let otherAmd: unknown
    const url = serve('previous/main.js', define => {
      withCurrentScript(otherScript, () => {
        otherAmd = define.amd
        define(['x'], factory)
      })
      define([], () => 'pack')
    })

    await expect(loadAmdModule(url, jest.fn())).resolves.toBe('pack')
    expect(previous).toHaveBeenCalledWith(['x'], factory)
    expect(otherAmd).toBe(previous.amd)
    expect((window as any).define).toBe(previous)
  })

  it('rejects if the script does not load, and tries again on the next call', async () => {
    const url = serve('missing/main.js')

    await expect(loadAmdModule(url, jest.fn())).rejects.toThrow(`Unable to load ${url}.`)
    expect('define' in window).toBe(false)

    serve('missing/main.js', define => define([], () => 'loaded'))
    await expect(loadAmdModule(url, jest.fn())).resolves.toBe('loaded')
  })

  it('rejects if the script does not define a module', async () => {
    const url = serve('no-define/main.js', () => {})

    await expect(loadAmdModule(url, jest.fn())).rejects.toThrow('did not define an AMD module')
  })

  it('rejects if a dependency cannot be resolved', async () => {
    const url = serve('unresolved/main.js', define => define(['dojo/on'], () => ({})))
    const resolve = () => {
      throw new Error('no dojo')
    }

    await expect(loadAmdModule(url, resolve)).rejects.toThrow('no dojo')
  })
})
