import Graphic from '@arcgis/core/Graphic'
import Circle from '@arcgis/core/geometry/Circle'
import Multipoint from '@arcgis/core/geometry/Multipoint'
import Point from '@arcgis/core/geometry/Point'
import Polygon from '@arcgis/core/geometry/Polygon'
import Polyline from '@arcgis/core/geometry/Polyline'
import { execute as executeDistance } from '@arcgis/core/geometry/operators/distanceOperator'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'
import Draw from '@arcgis/core/views/draw/Draw'
import type DrawAction from '@arcgis/core/views/draw/DrawAction'
import type Geometry from '@arcgis/core/geometry/Geometry'
import type { MapViewOrSceneView } from '@arcgis/core/views/MapViewOrSceneView'
import { type GeometryFormat } from '@vertigis/workflow/forms/FormDefinition'
import * as Promise from 'bluebird'

// In the 5.x typings the base DrawAction has no events (they're declared per concrete
// action) and on() no longer accepts an array of event names, although the runtime
// still supports both. Describe what the runtime actually accepts.
type EventedDrawAction = DrawAction & {
  on: (type: string | string[], listener: (event: any) => void) => { remove: () => void }
}

// The states that can be chosen in the geometry picker are different than the
// states that can be drawn and must be mapped to each other properly.
function getDrawAction(format: GeometryFormat, draw: Draw): EventedDrawAction | undefined {
  let action: EventedDrawAction
  // let tool: 'polygon' | 'polyline' | 'point' | 'multipoint' | 'rectangle' | 'circle' | 'ellipse'
  let tool: 'circle' | 'multipoint' | 'point' | 'polygon' | 'polyline' | 'rectangle' | undefined

  let mode: 'hybrid' | 'freehand' | 'click'
  switch (format) {
    case 'circle':
    case 'multipoint':
    case 'point':
    case 'polygon':
    case 'polyline':
      tool = format
      mode = 'click'
      break
    case 'extent':
      tool = 'rectangle'
      mode = 'click'
      break
    case 'line':
      tool = 'polyline'
      mode = 'click'
      break
    case 'polygon-freehand':
      tool = 'polygon'
      mode = 'freehand'
      break
    case 'polyline-freehand':
      tool = 'polyline'
      mode = 'freehand'
      break
    default:
      return undefined
  }

  action = draw.create(tool, { mode: mode }) as EventedDrawAction

  if (format === 'line') {
    const handle = action.on('vertex-add', e => {
      if (e.vertices.length === 2) {
        draw.complete()
        handle.remove()
      }
    })
  }

  return action
}

// The draw rectangle action only creates two verticies.  In order to
// properly display a rectangle we must add in the missing corners.
function createExtentFromVertices(vertices: number[][]): number[][] {
  const extent: number[][] = []
  extent.push(vertices[0])
  extent.push([vertices[1][0], vertices[0][1]])
  extent.push(vertices[1])
  extent.push([vertices[0][0], vertices[1][1]])

  return extent
}

export async function getDrawingTool(view: MapViewOrSceneView) {
  const removeTempWorkflowGraphics = () => {
    const graphics = view.graphics.toArray()
    view.graphics.removeAll()
    const graphicsToKeep = graphics.filter(g => !g.attributes?.TEMP_WORKFLOW_GRAPHIC)
    view.graphics.addMany(graphicsToKeep)
  }

  // Use the event data from each of the tools to produce the proper graphics.
  // Return the geometry used to draw the graphics
  function renderGraphic(format: GeometryFormat, event: any): Graphic {
    let graphic: Graphic | undefined
    if (event.vertices || event.coordinates) {
      removeTempWorkflowGraphics()
      switch (format) {
        case 'circle':
          graphic = getCircleGraphic(event.vertices)
          break
        case 'extent':
          if (event.vertices.length > 1) {
            event.vertices = createExtentFromVertices(event.vertices)
          }
          graphic = getPolygonGraphic(event.vertices)
          break
        case 'line':
        case 'polyline':
        case 'polyline-freehand':
          graphic = getPolylineGraphic(event.vertices)
          break
        case 'multipoint':
          graphic = getMultipointGraphic(event.vertices)
          break
        case 'point':
          graphic = getPointGraphic(event.coordinates)
          break
        case 'polygon':
        case 'polygon-freehand':
          graphic = getPolygonGraphic(event.vertices)
          break
        default:
          break
      }
      if (graphic) {
        graphic.attributes = {
          TEMP_WORKFLOW_GRAPHIC: true
        }
        view.graphics.add(graphic)
      }
    }
    return graphic
  }

  function isGeodesic() {
    return [4326, 3857].includes(view.spatialReference.wkid)
  }

  function getCircleGraphic(vertices: number[][]) {
    if (vertices.length === 0) {
      return undefined
    }

    const [point1, point2] = vertices

    const center = new Point({
      x: point1[0],
      y: point1[1],
      spatialReference: view.spatialReference
    })

    let radius = 50

    if (point2) {
      const outer = new Point({
        x: point2[0],
        y: point2[1],
        spatialReference: view.spatialReference
      })
      radius = executeDistance(center, outer, { unit: 'meters' })
    }

    const geometry = new Circle({
      center,
      geodesic: isGeodesic(),
      radius,
      spatialReference: view.spatialReference
    })

    const symbol = point2 ? new SimpleFillSymbol() : new SimpleMarkerSymbol()
    return new Graphic({ geometry, symbol })
  }

  function getMultipointGraphic(vertices: number[][]) {
    let geometry = new Multipoint({
      points: vertices,
      spatialReference: view.spatialReference
    })

    let graphic = new Graphic({
      geometry: geometry,
      symbol: new SimpleMarkerSymbol()
    })

    return graphic
  }

  function getPointGraphic(coordinates: number[]): Graphic {
    const geometry = new Point({
      x: coordinates[0],
      y: coordinates[1],
      spatialReference: view.spatialReference
    })

    const graphic = new Graphic({
      geometry: geometry,
      symbol: new SimpleMarkerSymbol()
    })

    return graphic
  }

  function getPolygonGraphic(vertices: number[][]): Graphic {
    const geometry = new Polygon({
      rings: [vertices],
      spatialReference: view.spatialReference
    })

    const graphic = new Graphic({
      geometry: geometry,
      symbol: new SimpleFillSymbol()
    })

    return graphic
  }

  function getPolylineGraphic(vertices: number[][]): Graphic {
    const geometry = new Polyline({
      paths: [vertices],
      spatialReference: view.spatialReference
    })

    const graphic = new Graphic({
      geometry: geometry,
      symbol: new SimpleLineSymbol()
    })

    return graphic
  }

  // This function is called every time a new shape is added via the geometry picker.
  return function (
    format: GeometryFormat,
    cancellation: Promise<void>,
    resolveCancellation: () => void
  ) {
    const draw = new Draw({ view: view })

    let resolvePromise: (result: Geometry) => void

    const promise = new Promise<Geometry>(resolve => {
      resolvePromise = resolve
    })

    promise.finally(function () {
      resolveCancellation()
    })

    const drawAction = getDrawAction(format, draw)

    if (drawAction) {
      draw.activeAction = drawAction

      // If the drawAction is cancelled before it is finished,
      // remove any drawing that has been done.
      cancellation.finally(function () {
        draw.reset()
        removeTempWorkflowGraphics()
        draw.activeAction = undefined
      })

      // After any action the shapes need to be redrawn
      drawAction.on(
        ['cursor-update', 'draw-complete', 'vertex-add', 'vertex-remove', 'undo', 'redo'],
        function (event) {
          const graphic = renderGraphic(format, event)

          // If the draw is finished, move the graphic from the temporary graphics
          // layer into the map graphics layer.
          if (event.type === 'draw-complete') {
            graphic.setAttribute('WORKFLOW_GRAPHIC', true)
            graphic.setAttribute('TEMP_WORKFLOW_GRAPHIC', false)
            removeTempWorkflowGraphics()
            view.graphics.add(graphic)
            resolvePromise(graphic.geometry)
          }
        }
      )
    }

    return promise
  }
}
