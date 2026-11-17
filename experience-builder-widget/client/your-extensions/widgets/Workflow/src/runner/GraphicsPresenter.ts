import Color from '@arcgis/core/Color'
import Graphic from '@arcgis/core/Graphic'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'
import type Geometry from '@arcgis/core/geometry/Geometry'
import type MapView from '@arcgis/core/views/MapView'
import type SceneView from '@arcgis/core/views/SceneView'
import type EsriSymbol from '@arcgis/core/symbols/Symbol'
import { EnumUtils } from '@vertigis/workflow/EnumUtils'
import { type GeometryState } from '@vertigis/workflow/forms/FormDefinition'
import * as Promise from 'bluebird'

/**
 * The different states of highlighting that a graphic can be in.
 * The order is important as it affects the z-order.
 */
enum HighlightState {
  NotHighlightedAndNotSelected,
  NotHighlightedAndSelected,
  HighlightedAndNotSelected,
  HighlightedAndSelected
}

/**
 * Defines the various graphics needed for each geometry.
 * In particular, we draw two borders on top of each other to give
 * increased contrast.
 */
enum GeometryGraphic {
  // The main graphic defines the geometry, but its border can only be one colour.
  MainGraphic,
  // The contrast graphic contains a thinner border of a contrasting colour, to help
  // make it easy to see.
  ContrastGraphic
}

/**
 * Keep a dynamically-generated reference to the values in GeometryGraphic so
 * we can iterate through them instead of copying and pasting code.
 */
const geometryGraphicValues = EnumUtils.getValues(GeometryGraphic)

const unhighlightedFillColour = Color.fromRgb('rgba(236, 236, 58, 0.1)')
const unhighlightedInnerBorderColour = Color.fromRgb('rgba(255, 255, 151, 1)')
const unhighlightedOuterBorderColour = Color.fromRgb('rgba(200, 200, 0, 1)')

const highlightedFillColour = Color.fromRgb('rgba(0, 255, 255, 0.2)')
const highlightedInnerBorderColour = Color.fromRgb('rgba(0, 255, 255, 1)')
const highlightedOuterBorderColour = Color.fromRgb('rgba(87, 170, 255, 1)')

const unselectedInnerLineWidth = 2
const unselectedOuterLineWidth = 5

const selectedInnerLineWidth = 4
const selectedOuterLineWidth = 10 // TODO: Why was this set to 8?

/**
 *  We have an additional opacity setting for polyLines because lines don't have a fill area
 *  and cannot otherwise be translucent without changing the opacity on the line itself.
 */
const polyLineOpacity = 0.5

// The SimpleMarkerSymbol can't have an empty fill, so instead
// we use a colour with no alpha which is effectively empty.
const emptyColour = Color.fromRgb('rgba(0, 0, 0, 0)')

interface LineStyle {
  width: number
  colour: Color
}

interface GeometryStyle {
  fillColour?: Color
  outerLineStyle?: LineStyle
  innerLineStyle?: LineStyle
}

const geometryStyles: { [highlightState: number]: GeometryStyle } = {
  [HighlightState.NotHighlightedAndNotSelected]: {
    fillColour: unhighlightedFillColour,
    outerLineStyle: {
      colour: unhighlightedOuterBorderColour,
      width: unselectedOuterLineWidth
    },
    innerLineStyle: {
      colour: unhighlightedInnerBorderColour,
      width: unselectedInnerLineWidth
    }
  },
  [HighlightState.NotHighlightedAndSelected]: {
    fillColour: highlightedFillColour,
    outerLineStyle: {
      colour: highlightedOuterBorderColour,
      width: selectedOuterLineWidth
    },
    innerLineStyle: {
      colour: highlightedInnerBorderColour,
      width: selectedInnerLineWidth
    }
  },
  [HighlightState.HighlightedAndNotSelected]: {
    fillColour: highlightedFillColour,
    outerLineStyle: {
      colour: highlightedOuterBorderColour,
      width: unselectedOuterLineWidth
    },
    innerLineStyle: {
      colour: highlightedInnerBorderColour,
      width: unselectedInnerLineWidth
    }
  },
  [HighlightState.HighlightedAndSelected]: {
    fillColour: highlightedFillColour,
    outerLineStyle: {
      colour: highlightedOuterBorderColour,
      width: selectedOuterLineWidth
    },
    innerLineStyle: {
      colour: highlightedInnerBorderColour,
      width: selectedInnerLineWidth
    }
  }
}

/*

The premise of this facility is to provide a means to efficiently present graphics on a map. The
facility must be able to handle rapid state changes with minimal overhead. This means updating
the graphics in response to random changes is not good enough. In principle, invalidate when
updates are required, then dump the updates on the next tick. These gives pretty good
reactivity but keeps things relatively performant.

*/

export interface IGraphicsPresenter {
  renderGeometry: (name: string, state?: GeometryState[]) => boolean
  dispose: () => void
}

/**
 * Determines which of the four states the geometry is in.
 * Although we only render three different graphic styles, we still need to recognize the four geometry states
 * for z-ordering purposes.
 * @param state
 */
function getHighlightState(state: GeometryState): HighlightState {
  const highlighted = state.pending || state.focused
  if (state.checked) {
    return highlighted
      ? HighlightState.HighlightedAndSelected
      : HighlightState.NotHighlightedAndSelected
  }
  return highlighted
    ? HighlightState.HighlightedAndNotSelected
    : HighlightState.NotHighlightedAndNotSelected
}

/**
 * Get z-order based on geometry type. This must return a unique value for each
 * value type as it is used as part of the unique identifier for the symbol used
 * in each case.
 * @param type
 */
function getOrderForGeometryType(type: string): number {
  switch (type) {
    case 'point':
      return 6
    case 'multipoint':
      return 5
    case 'line':
      return 4
    case 'polyline':
      return 3
    case 'extent':
      return 2
    case 'polygon':
      return 1
    default:
      console.warn('Unhandled type in getOrderForGeometryType', type)
      return 0
  }
}

/**
 * Return a unique id for the type/state supplied.
 * This serves two purposes:
 *   1) Establish the z-order of graphics on the map.
 *   2) Allow us to re-use symbols by finding them by id.
 *
 * The result will be up to six bits long, comprised as follows:
 *
 *   54|321|0
 *   --|---|-
 *   xx|xxx|x
 *
 *   * Bit #0 is is set based on the GeometryGraphic.
 *   * Bits #1-3 are set based on the type of geometry being represented.
 *   * Bits #4-5 are set based on the HighlightState.
 *
 * This ensures that selected geometries will always appear in front of those that are not.
 * If two graphics have the same state, the order of geometry type comes into play.
 * Finally, we ensure that the contrast graphic always appears in front of the main one so
 * the highlight border is visible.
 *
 * @param type The type of geometry to be drawn on the map.
 * @param highlightState The state of the geometry in terms of selection and highlighting.
 * @param geometryGraphic The state of the graphic in terms of selection and highlighting.
 */
function getIdForGraphic(
  type: string,
  highlightState: HighlightState,
  geometryGraphic: GeometryGraphic
) {
  return (highlightState << 4) | (getOrderForGeometryType(type) << 1) | geometryGraphic
}

const symbols = {}

function makeLineSymbolFromStyle(lineStyle: LineStyle, opacity?: number): SimpleLineSymbol {
  const symbol = new SimpleLineSymbol()

  if (opacity) {
    symbol.color = new Color(lineStyle.colour.toHex())
    symbol.color.a = opacity
  } else {
    symbol.color = lineStyle.colour
  }

  symbol.width = lineStyle.width

  return symbol
}

/**
 * Returns a new SimpleLineSymbol based on the supplied parameters.
 * @param geometryStyle All of the styles for the geometry.
 * @param geometryGraphic The graphic that needs the symbol. We need different symbols for the inner and outer borders.
 * @param opacity (optional) A custom opacity for the symbol.
 */
function makeLineSymbol(
  geometryStyle: GeometryStyle,
  geometryGraphic: GeometryGraphic,
  opacity?: number
): SimpleLineSymbol {
  switch (geometryGraphic) {
    case GeometryGraphic.MainGraphic:
      return makeLineSymbolFromStyle(geometryStyle.outerLineStyle, opacity)
    case GeometryGraphic.ContrastGraphic:
      return makeLineSymbolFromStyle(geometryStyle.innerLineStyle, opacity)
  }
}

function makeFillSymbol(
  geometryStyle: GeometryStyle,
  geometryGraphic: GeometryGraphic
): SimpleFillSymbol {
  const symbol = new SimpleFillSymbol()
  symbol.outline = makeLineSymbol(geometryStyle, geometryGraphic)

  switch (geometryGraphic) {
    case GeometryGraphic.MainGraphic:
      symbol.color = geometryStyle.fillColour
      break
    case GeometryGraphic.ContrastGraphic:
      symbol.style = 'none'
      break
  }

  return symbol
}

function makeMarkerSymbol(
  geometryStyle: GeometryStyle,
  geometryGraphic: GeometryGraphic
): SimpleMarkerSymbol {
  const symbol = new SimpleMarkerSymbol()
  symbol.outline = makeLineSymbol(geometryStyle, geometryGraphic)

  switch (geometryGraphic) {
    case GeometryGraphic.MainGraphic:
      symbol.color = geometryStyle.fillColour
      break
    case GeometryGraphic.ContrastGraphic:
      symbol.color = emptyColour
      break
  }

  return symbol
}

function getSymbol(
  id: number,
  type: string,
  geometryStyle: GeometryStyle,
  geometryGraphic: GeometryGraphic
): EsriSymbol {
  const symbol: EsriSymbol = symbols[id]
  if (symbol !== undefined) {
    return symbol
  }

  switch (type) {
    case 'extent':
    case 'polygon':
      return (symbols[id] = makeFillSymbol(geometryStyle, geometryGraphic))
    case 'line':
    case 'polyline':
      return (symbols[id] = makeLineSymbol(geometryStyle, geometryGraphic, polyLineOpacity))
    case 'point':
    case 'multipoint':
      return (symbols[id] = makeMarkerSymbol(geometryStyle, geometryGraphic))
    default:
      return undefined
  }
}

// This is our special graphic type, we need a little extra
// book keeping to prevent unstable reordering.
class WorkflowGraphic extends Graphic {
  /** The calculated order for this graphic, used for sorting. */
  order: number
}

function compareGraphics(g1: WorkflowGraphic, g2: WorkflowGraphic) {
  return g1.order - g2.order
}

export function defineGraphicsPresenterFactory(view: SceneView | MapView) {
  let presenters: GraphicsPresenter[] = []
  let updater = Promise.resolve()

  function removeWorkflowGraphics() {
    const graphics = view.graphics.toArray()
    view.graphics.removeAll()
    const graphicsToKeep = graphics.filter(g => !g.attributes?.WORKFLOW_GRAPHIC)
    view.graphics.addMany(graphicsToKeep)
  }

  function update() {
    const graphics: Graphic[] = []
    presenters = presenters.filter(x => x.collect(graphics))
    const sortedGraphics = graphics.sort(compareGraphics)

    // Remove the old graphics
    removeWorkflowGraphics()
    if (sortedGraphics.length > 0) {
      view.graphics.addMany(sortedGraphics)
    }
  }

  function invalidate() {
    if (updater.isResolved()) {
      // Defer our next update so we don't churn too much.
      // We may get lots of state changes in quick succession.
      updater = Promise.resolve().then(update)
    }
  }

  class GraphicsPresenter implements IGraphicsPresenter {
    private lookup: any = {}
    private active = true

    constructor() {
      presenters.push(this)
    }

    collect(list: Graphic[]): boolean {
      if (this.active) {
        const lookup = this.lookup
        for (const key in lookup) {
          list.push(...lookup[key]())
        }

        return true
      }

      return false
    }

    renderGeometry(name: string, state?: GeometryState[]) {
      // If a state is passed in, add a draw function to the
      // lookup object of that state's element.
      if (state !== undefined && state !== null) {
        this.lookup[name] = function () {
          const graphics: WorkflowGraphic[] = []
          for (const item of state) {
            const geometry = <Geometry>item.content
            if (geometry !== undefined && geometry !== null) {
              let geometryGraphics = <WorkflowGraphic[]>item.context
              let graphic: WorkflowGraphic
              if (geometryGraphics === undefined) {
                geometryGraphics = []
                item.context = geometryGraphics
                for (const val of geometryGraphicValues) {
                  graphic = new WorkflowGraphic()
                  graphic.geometry = geometry
                  graphic.visible = true
                  geometryGraphics[val] = graphic
                  graphic.attributes = {
                    WORKFLOW_GRAPHIC: true
                  }
                }
              }

              const highlightState = getHighlightState(item)
              const geometryStyle = geometryStyles[highlightState]

              for (const val of geometryGraphicValues) {
                const id = getIdForGraphic(geometry.type, highlightState, val)
                graphic = geometryGraphics[val]
                graphic.order = id
                graphic.symbol = getSymbol(id, geometry.type, geometryStyle, val)
              }

              graphics.push(...geometryGraphics)
            }
          }
          return graphics
        }
        // If a state does not exist, remove that function from the dictionary.
      } else {
        delete this.lookup[name]
      }

      invalidate()
      return this.active
    }

    // Remove all graphics added to the map.
    dispose() {
      this.active = false
      invalidate()
    }
  }

  return function (): IGraphicsPresenter {
    return new GraphicsPresenter()
  }
}
