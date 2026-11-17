/** @jsx jsx */
import { type IMThemeVariables } from 'jimu-core'
import type { GeometryRef } from '@vertigis/workflow/forms/FormDefinition'
import { type defs, FormRenderer } from '@vertigis/workflow/activities/forms/FormRenderer'
import { releaseForm } from '@vertigis/workflow/forms/presenter'
import { FormComponent, type FormPresenterHost } from '@vertigis/workflow/forms/FormComponent'
import { HostProvider } from '@vertigis/workflow/forms/hostContext'
import { getDrawingTool } from './captureGeometry'
import { type Engine } from '@vertigis/workflow/execution/Engine'
import { defineGraphicsPresenterFactory, type IGraphicsPresenter } from './GraphicsPresenter'
import { createGeometryRef, sanitizeGeometryRef } from '@vertigis/workflow/forms/utils.js'
import { getWidgetComponentIds } from '../utils'
import { ComponentType, ReactNode, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import UIService from '@vertigis/workflow/ui/UIService'
import { LicenseInfo } from '@vertigis/react-ui/LicenseInfo'
import CircularProgress from '@vertigis/react-ui/CircularProgress'
import type Geometry from '@arcgis/core/geometry/Geometry'
import type MapView from '@arcgis/core/views/MapView'
import type SceneView from '@arcgis/core/views/SceneView'
import { FormThemeProvider, setFormTheme } from './formTheme'

const MUI_LICENSE_KEY =
  '77a0487cdf8bb2746635f4291a8dce59Tz0xMzMxMDcsRT0xODIxMzExOTk5MDAwLFM9cHJvLExNPWFubnVhbCxQVj1RMS0yMDI2LFE9NSxBVD1zaW5nbGUsS1Y9Mg=='

const formRoots = new WeakMap<HTMLElement, Root>()

/**
 * Renders a form the same way as the SDK's `refreshForm()`, but wrapped in a theme provider so the form's MUI
 * components follow the ExB theme instead of MUI's default light theme.
 *
 * The SDK disables a form while it's busy (running an event or loading the next form) but leaves showing that to the
 * host app, so a busy form also gets a loading overlay like it does in Web.
 */
function renderThemedForm(host: FormPresenterHost, container: HTMLElement, widgetId: string, busy: boolean) {
  let root = formRoots.get(container)
  if (!root) {
    root = createRoot(container)
    formRoots.set(container, root)
  }
  root.render(
    createElement(
      FormThemeProvider,
      { widgetId },
      createElement(
        'div',
        { className: busy ? 'workflow-form-container busy' : 'workflow-form-container', 'aria-busy': busy },
        createElement(
          HostProvider,
          { value: host as any },
          createElement(FormComponent, { host, type: 'form', children: [] })
        ),
        busy &&
          createElement(
            'div',
            { className: 'workflow-form-busy-overlay' },
            createElement(CircularProgress, { className: 'workflow-form-busy-indicator' })
          )
      )
    )
  )
}

function releaseThemedForm(container: HTMLElement) {
  formRoots.get(container)?.unmount()
  formRoots.delete(container)
  // Also release anything the SDK rendered itself.
  releaseForm(container)
}

export async function register(
  engine: Engine,
  view: SceneView | MapView,
  showModal: (show?: boolean) => void,
  theme: IMThemeVariables,
  id: string,
  showFormTitle: boolean,
  uiService: UIService
) {
  // HACK: Workflow's MUI-X license key is currently expired. Setting the valid key here
  // allows us to override it at runtime without needing to modify the package. This should be removed when
  // Workflow updates to use a valid key.
  LicenseInfo.setLicenseKey(MUI_LICENSE_KEY)

  let captureGeometry: (
    format: defs.GeometryFormat,
    cancellation: Promise<void>,
    resolveCancellation: () => void
  ) => Promise<Geometry>

  let graphicsPresenterFactory: any

  if (view?.map) {
    captureGeometry = await getDrawingTool(view)
    graphicsPresenterFactory = defineGraphicsPresenterFactory(view)
  }

  const componentIds = getWidgetComponentIds(id)
  setFormTheme(id, theme)

  // Get the default containers.
  const defaultContainer = document.getElementById(componentIds.panel)
  const defaultTitleContainer = document.getElementById(componentIds.panelHeader)

  // Map of all current instances of workflow forms being run.
  const instances: {
    [name: string]: FormContainer
  } = {}

  class FormContainer {
    protected current: CustomFormRenderer
    protected name: string
    // Widget id
    id: string

    constructor(name: string, id: string) {
      this.name = name
      this.id = id
      instances[this.name] = this
      instances['id$' + this.id] = this
    }

    assign(next: CustomFormRenderer) {
      if (this.current !== next) {
        const current = this.current
        this.current = next
        return current
      }
      return this.current
    }

    closed() {
      const current = this.current
      showModal(false)
      if (current !== undefined) {
        current.dispose()
      }
    }

    isModal() {
      return this.name === 'modal'
    }
  }

  function createInstance(container: defs.ContainerRef) {
    const name = typeof container === 'string' ? container : 'default'
    return instances[name] || new FormContainer(name, id)
  }

  const HIDDEN_CLASS_NAME = 'hidden'
  const WIDGET_BASE_CLASS_NAME = 'workflow-widget-base'

  class CustomFormRenderer extends FormRenderer {
    protected tool: Promise<void> | undefined
    protected resolveTool: (() => void) | undefined
    protected instance: FormContainer | undefined

    protected graphicsPresenter: IGraphicsPresenter
    private targetContainer: HTMLElement
    private titleElement: Element

    mount() {
      // Hide or dispose of the previous form before showing the panel. Both call unmount() on the
      // previous form, which hides the panel, so doing this afterwards would hide this form too.
      const instance =
        this.instance || (this.instance = createInstance(this.form.defaults.container))

      const previous = instance.assign(this)
      if (previous !== this && previous !== undefined) {
        previous.instance = undefined
        if (this.isRelated(previous)) {
          // The previous form is either from the same workflow or a related one,
          // so we just hide it in case it's needed again.
          previous.hide()
        } else {
          // The previous form is assumed to be from a previous, unrelated workflow.
          // We dispose of it, which also cancels that workflow if it's still running.
          previous.dispose()
        }
      }

      document.getElementById(componentIds.icon)?.classList.add(HIDDEN_CLASS_NAME)

      // Add solid background for form elements
      document.getElementById(componentIds.root)?.classList.add(WIDGET_BASE_CLASS_NAME)
      document.getElementById(componentIds.panel)?.classList.remove(HIDDEN_CLASS_NAME)
      if (showFormTitle) {
        document.getElementById(componentIds.panelHeader)?.classList.remove(HIDDEN_CLASS_NAME)
      }

      if (this.form.defaults.container === 'modal') {
        // We have to make sure the modal is rendered before we can attach the form to it.  This shouldn't cause
        // any issues, but there may be some flashing some times
        showModal(true)
        // We need to apply a small delay to allow the modal to render before we attach the form to it.
        // If we don't do this there is a chance the modal appears and blocks the UI but the form doesn't show up.
        setTimeout(() => {
          this.targetContainer = document.getElementById(componentIds.modal)
          this.titleElement = document.getElementById(componentIds.modalHeader)

          this.configureTargetContainer()
          this.update()
        }, 200)
      } else {
        this.targetContainer = defaultContainer
        this.titleElement = defaultTitleContainer
        this.configureTargetContainer()
        super.update()
      }
    }

    unmount() {
      showModal(false)
      this.cancelTool()
      this.disposeGraphicsPresenter()

      if (this.targetContainer) {
        const container = this.container
        const parent = container.parentNode
        if (parent !== undefined && parent !== null) {
          parent.removeChild(container)
        }
      }

      this.instance = undefined

      releaseThemedForm(this.container)
      document.getElementById(componentIds.icon)?.classList.remove(HIDDEN_CLASS_NAME)
      document.getElementById(componentIds.root)?.classList.remove(WIDGET_BASE_CLASS_NAME)
      document.getElementById(componentIds.panel)?.classList.add(HIDDEN_CLASS_NAME)
      if (showFormTitle) {
        document.getElementById(componentIds.panelHeader)?.classList.add(HIDDEN_CLASS_NAME)
      }
    }

    /**
     * When a form completes we need to return to a previous one properly.
     * If the current form is a modal we need to hide it to make the previous one accessible.
     */
    spinNoBlock() {
      const instance = this.instance
      if (instance !== undefined && !instance.isModal()) {
        return super.spinNoBlock()
      }

      return this.hide()
    }

    findHeaderElement(name: string) {
      // Figure out if the name references an element, otherwise return undefined.
      const element = this.form.elements[name]
      if (element !== undefined && element !== null && element.section === 'header') {
        return element
      }

      return undefined
    }

    refresh(name?: string) {
      // Figure out if we should refresh the header.
      if (typeof name !== 'string' || this.findHeaderElement(name) !== undefined) {
        this.refreshHeader()
      }

      // A full refresh renders the whole form; do that ourselves so it gets the ExB theme.
      // Single element refreshes re-render within that tree, so the SDK can handle them.
      // The SDK does a full refresh whenever the form becomes busy or idle, which keeps the overlay in sync.
      if (typeof name !== 'string' && !this.custom) {
        this.refs = {}
        renderThemedForm(this, this.container, id, !this.enabled)
        return
      }

      super.refresh(name)
    }

    refreshHeader() {
      // Hoists elements which involve the header.
      // Right now, this is all header elements.
      for (const name in this.form.elements) {
        const element = this.findHeaderElement(name)
        if (element !== undefined) {
          // Indicate to our default rendering logic that it should not consider this one.
          element.hoisted = true

          // Use the element type to type-check our condition.
          if (element.type === 'Header') {
            if (this.titleElement) {
              this.titleElement.innerHTML = this.renderText(element.title)
            }
          }
        }
      }
    }

    route(event: defs.Event): boolean {
      if (event.type === 'clicked') {
        const name = event.name
        const element = this.form.elements[name]
        if (element !== undefined && element !== null && element.type === 'GeometryPicker') {
          this.cancelTool()
          this.appendGeometry(name, element)
          return true
        }
      }

      return super.route(event)
    }

    cancelTool() {
      let tool = this.tool
      if (tool !== undefined) {
        this.resolveTool!()
        this.tool = undefined
        this.resolveTool = undefined
      }
    }

    async appendGeometry(name: string, element: defs.Element) {
      if (!captureGeometry) {
        console.warn('A map must be present to capture a geometry.')
        return
      }
      let value = sanitizeGeometryRef(element.value)
      if (value === undefined) {
        const format = element.format as defs.GeometryFormat
        value = createGeometryRef(format)
      }

      const cancellation = (this.tool = new Promise<void>(resolve => {
        this.resolveTool = resolve
      }))

      cancellation.finally(() => {
        if (this.tool === cancellation) {
          this.tool = undefined
        }
      })

      const geometry = await captureGeometry(value.format, cancellation, this.resolveTool!)

      // Make sure this is a new object so the Geometry Picker re-renders.
      const newValue = {
        ...value,
        // The array must also be a different array.
        geometry: [...value!.geometry, geometry]
      } as GeometryRef
      element.value = newValue

      this.invalidate(name)
      this.post('changed', { name, value })
    }

    async displayDialog(
      children: (closeDialog: () => void) => ReactNode,
      DialogComponent: ComponentType<any>
    ) {
      showModal(true)
      const childrenExB = (close: () => void) => {
        showModal(false)
        return children(close)
      }
      await uiService.displayDialog(childrenExB, DialogComponent)
    }

    renderState(name: string, type: string, state?: object): boolean {
      if (graphicsPresenterFactory) {
        let presenter = this.graphicsPresenter
        if (presenter === undefined) {
          this.graphicsPresenter = presenter = graphicsPresenterFactory()
        }

        if (type === 'geometry') {
          return presenter.renderGeometry(name, state as defs.GeometryState[])
        } else if (type === 'item-picker') {
          const itemPickerState = state as defs.ItemPickerState | undefined
          return presenter.renderGeometry(name, itemPickerState?.items || [])
        }
      }

      return super.renderState(name, type, state)
    }

    disposeGraphicsPresenter() {
      const presenter = this.graphicsPresenter
      if (presenter !== undefined) {
        presenter.dispose()
        this.graphicsPresenter = undefined
      }
    }

    private configureTargetContainer(): void {
      if (this.targetContainer) {
        if (!this.container.parentNode) {
          // Clear out anything that's already in the target container.
          // TODO: Should we put in some effort to remove event handlers
          //       at this point to facilitate garbage collection?
          let firstChild: Node = this.targetContainer.firstChild
          while (firstChild) {
            this.targetContainer.removeChild(firstChild)
            firstChild = this.targetContainer.firstChild
          }
          this.targetContainer.appendChild(this.container)
        }
      }
    }
  }

  ;(engine.trivia as any).FormRenderer = CustomFormRenderer
  CustomFormRenderer.register(engine.activator)
}
