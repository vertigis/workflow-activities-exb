import { type SerializedStyles, type IMThemeVariables, css } from 'jimu-core'
import { getWidgetComponentIds } from '../utils'

/**
 * Applies the custom theme to workflow forms.
 *
 * As there is no current way to identify element titles right now, they are identified via span>p.
 * This may cause issues if there are features that use that combination of tags in the future.
 *
 * Headers are assumed to be typography variant title3.
 * @param theme The custom theme provider that ExB creates and provides to widgets.
 * @returns
 */

export const getStyles = (
  theme: IMThemeVariables,
  modalId: string,
  widgetId: string
): SerializedStyles => {
  const componentIds = getWidgetComponentIds(widgetId)
  return css`
    .widget-base {
      max-height: 100%;
      overflow-y: auto;
    }
    #workflow-panel-${widgetId} {
      background: ${theme.sys.color.surface.background};
      padding: 1.5rem;
    }
    .hidden {
      display: none;
    }
    .workflow-root {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .workflow-modal-root {
      max-height: 80%;
    }
    #${componentIds.icon}.hidden, #${componentIds.panelHeader}.hidden {
      display: none;
    }
    .form {
      width: 100%;
      height: 100%;
      min-height: 20rem;
      padding: 0.5rem;
      background-color: white;
      .form-box {
        height: auto;
        min-height: 6.5rem;
        margin-bottom: 0.5rem;
        width: 100%;
        border-radius: 0.5rem;
        border: solid grey 3px;
        background-color: lightgrey;
      }
      .form-box:last-of-type {
        margin-bottom: 0;
      }
    }
    .logo {
      width: auto;
      height: auto;
    }
    .form-logo {
      height: 100%;
      width: 100%;
    }
    .form-logo-background {
      width: 100%;
      height: 100%;
      background: white;
    }
    .clickable {
      cursor: pointer;
    }
    .gcx-forms {
      padding: 1rem;
    }
    #${modalId} .Form-root {
      background: transparent;
    }
    .modal-dialog {
      height: 100%;
    }
    .modal-content {
      height: 50%;
    }
    .workflow-modal-root {
      overflow-y: auto;
    }
    .gcx-form-header {
      padding: 1rem 1.5rem 0.5rem;
      background: ${theme.sys.color.surface.background};
      color: ${theme.sys.color.surface.backgroundText};
      font-family: ${theme.sys.typography.body.fontFamily};
      font-size: 1.25rem;
      font-weight: ${theme.sys.typography.body.fontWeight};
      display: flex;
      align-items: center;
    }
    .Form-root .Form-body > label,
    .Form-root .Form-body > div {
      padding-bottom: 0.625rem;
      padding-top: 0.625rem;
      width: 100%;
    }
    .Form-root .Row {
      display: flex;
      gap: 0.5em;
    }
    .Form-root .Row > * {
      flex: 1;
    }
    .Form-root .Section .content > label,
    .Form-root .Form-body > div,
    .Form-root .FilePicker .add-file .add,
    .Form-root .GeometryPicker .add-shape,
    .Form-root .TimePickerInput,
    .Form-root .TimePicker .overlay input,
    .Form-root .DateTimePicker .overlay input,
    .Form-root input,
    .Form-root select,
    .Form-root textarea {
      width: 100%;
    }
    .Form-root .Form-body > .inline-title,
    .Form-root .inline-title {
      align-items: start;
      display: grid;
      grid-template-columns: 1fr 2fr;
    }
    .Form-root.custom {
      background: ${theme.sys.color.surface.background};
      color: ${theme.sys.color.surface.backgroundText};
      font-family: ${theme.sys.typography.body.fontFamily};
      font-size: ${theme.sys.typography.body.fontSize};
      font-style: ${theme.sys.typography.body.fontStyle};
      font-weight: ${theme.sys.typography.body.fontWeight};
    }
    .workflow-widget-base {
      background: ${theme.sys.color.surface.background};
    }
    .workflow-form-container {
      position: relative;
    }
    /* Leave room for the loading indicator when the form has nothing to show yet (e.g. during its load event). */
    .workflow-form-container.busy {
      min-height: 6rem;
    }
    .workflow-form-busy-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Short events are common, so wait a moment before showing the overlay to avoid it flashing. */
      animation: workflow-form-busy-fade-in 0.2s ease-in 0.15s both;
    }
    .workflow-form-busy-overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background: ${theme.sys.color.surface.background};
      opacity: 0.6;
    }
    .workflow-form-busy-indicator {
      position: relative;
    }
    @keyframes workflow-form-busy-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .Form-root p,
    .Form-root .Section,
    .Form-root .NumberRangeSlider,
    .Form-root .CheckGroup,
    .Form-root .DateTimePicker .SimpleDatePicker,
    .Form-root .TimePickerInput .bottom {
      margin-bottom: 0.5rem;
    }
    .Form-root .notice p,
    .Form-root .items label {
      margin-bottom: 0;
    }
    .Form-root .error .inline {
      color: ${theme.sys.color.error.main};
    }
    .Form-root .error input,
    .Form-root .error textarea,
    .Form-root .error .shell,
    .Form-root .error select {
      border: 1px solid ${theme.sys.color.error.main};
    }
    .Form-root .notice {
      color: ${theme.sys.color.error.main};
      font-size: smaller;
    }
    .Form-root .ButtonBar button,
    .Form-root .FilePicker .file button,
    .Form-root .GeometryPicker .shape button,
    .Form-root .GeometryPicker .shape .delete,
    .Form-root .FilePicker .file .delete,
    .Form-root .FilePicker .file label,
    .Form-root .ItemPicker > div > button,
    .Form-root .GeometryPicker .shape label {
      border-radius: ${theme.sys.shape.shape1};
      font-size: ${theme.sys.typography.body.fontSize};
      line-height: ${theme.sys.typography.body.lineHeight};
      padding: ${theme.sys.spacing(1)} ${theme.sys.spacing(2)};
      background: ${theme.sys.color.action.default};
      color: ${theme.sys.color.action.text} !important;
      border-color: ${theme.sys.color.divider.primary};
      border-width: 1px;
      border-style: solid;
    }
    .Form-root .ButtonBar button {
      margin-bottom: 0.25rem;
      margin-right: 0.5rem;
    }
    .Form-root .ButtonBar button:hover,
    .Form-root .FilePicker .file button:hover,
    .Form-root .GeometryPicker .shape button:hover,
    .Form-root .FilePicker .file label,
    .Form-root .GeometryPicker .shape.hover label,
    .Form-root .ItemPicker > div > button:hover,
    .Form-root .ListBox option:hover {
      background: ${theme.sys.color.action.hover} !important;
    }
    .Form-root span > p {
      color: ${theme.sys.color.surface.backgroundText};
      font-family: ${theme.sys.typography.title3.fontFamily};
      font-size: ${theme.sys.typography.title3.fontSize};
      font-weight: ${theme.sys.typography.title3.fontWeight};
      line-height: ${theme.sys.typography.title3.lineHeight};
      margin-bottom: 0.25rem;
    }
    .Form-root .Section > span.title > p {
      color: ${theme.sys.color.surface.backgroundText};
      font-family: ${theme.sys.typography.title2.fontFamily};
      font-size: ${theme.sys.typography.title2.fontSize};
      font-weight: ${theme.sys.typography.title2.fontWeight};
      line-height: ${theme.sys.typography.title2.lineHeight};
    }
    .Form-root .MuiInputBase-root,
    .Form-root .MuiInput-root {
      border-width: 1px;
      border-style: solid;
      border-color: ${theme.sys.color.divider.inputField};
      border-radius: 0.25rem;
      padding: 0 0.25rem;
      overflow-x: hidden;
    }
    /*
     * Picker adornment buttons (calendar/clock) are taller than the text, making pickers taller than text boxes and
     * drop downs. Give single-line inputs a common height and keep the buttons within it.
     */
    .Form-root .MuiInputBase-root:not(.MuiInputBase-multiline) {
      box-sizing: border-box;
      min-height: 2.25rem;
    }
    .Form-root .MuiInputBase-root .MuiInputAdornment-root .MuiIconButton-root {
      padding: 0.25rem;
    }
    /* Fill the height so the whole box opens the drop down, not just the text. */
    .Form-root .MuiInputBase-root .MuiNativeSelect-select {
      align-self: stretch;
    }
    .Form-root .MuiInputBase-root.Mui-error,
    .Form-root .MuiInput-root.Mui-error {
      border-color: ${theme.sys.color.error.main};
    }
    .Section.collapsible-section > .form-element-title,
    .Section.accordion-section > .form-element-title {
      cursor: pointer;
      border: none;
      display: flex;
      flex-direction: row;
      align-items: center;
      margin: 0;
      padding: 0.2em 0.6em 0.2em 0.6em;
      text-align: left;
      width: 100%;
      background: ${theme.sys.color.primary.main};
      border-radius: ${theme.sys.shape.shape2};
      color: ${theme.sys.color.primary.text};
      margin-bottom: 0.5rem;
      transition: background 0.5s ease;
    }
    .Section.collapsible-section > .form-element-title .caption,
    .Section.accordion-section > .form-element-title .caption {
      display: flex;
      flex: 1;
      align-items: center;
      overflow: hidden;
    }
    .Form-root .chevronUp,
    .Form-root .chevronDown {
      fill: ${theme.sys.color.primary.text};
      display: inline-block;
      width: 24px;
      height: 24px;
    }
    .Section.collapsible-section .content.collapsed,
    .Section.accordion-section .content.collapsed,
    .Form-root .GeometryPicker .clear,
    .Form-root .GeometryPicker .shape input,
    .Form-root .Numeric input[type='range'],
    .Form-root .TimePickerInput .up .content,
    .Form-root .TimePickerInput .down .content {
      display: none;
    }
    .Form-root .Section.WorkflowSection-basicSection {
      margin: 0.5em 0;
      padding-left: 1em;
      padding-right: 1em;
      padding-bottom: 0.625em;
      border-left-color: ${theme.sys.color.divider.primary};
      border-left-style: solid;
      border-left-width: 0.5em;
    }
    .Form-root .Section.WorkflowSection-fieldSetSection {
      margin: 0.5em 0 1.5em;
      border-color: ${theme.sys.color.divider.primary};
      border-style: solid;
      border-width: 0 0 3px;
      /* Kept small since the last element already brings its own bottom margin. */
      padding: 0 0 0.25em;
    }
    /*
     * Inset the content (but not the title, which starts the top divider). 11px offsets MUI's -11px FormControlLabel
     * margin-left, and mirroring it on the right keeps checkbox/radio hover highlights centered between the dividers.
     */
    .Form-root .Section.WorkflowSection-fieldSetSection > :not(.WorkflowSection-title) {
      padding: 0 11px;
    }
    .Form-root .Section.WorkflowSection-fieldSetSection .MuiFormControlLabel-root {
      margin-right: -11px;
    }
    /*
     * Dividers above and below with the title sitting on the top one, like the Workflow sandbox. The SDK floats the
     * title over the top border and masks it with a solid background, which won't match ExB's panel/modal backgrounds,
     * so the top divider is drawn as a line after the title instead.
     */
    .Form-root .Section.WorkflowSection-fieldSetSection > .WorkflowSection-title {
      position: static;
      background: none;
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-bottom: 1em;
    }
    .Form-root .Section.WorkflowSection-fieldSetSection > .WorkflowSection-title::after {
      content: '';
      flex: 1;
      min-width: 1em;
      border-top: 3px solid ${theme.sys.color.divider.primary};
    }
    .Form-root .Section.WorkflowSection-fieldSetSection > .WorkflowSection-title span,
    .Form-root .Section.WorkflowSection-fieldSetSection > .WorkflowSection-title p {
      margin: 0;
      padding: 0;
    }
    .Form-root .Section.WorkflowSection-fieldSetSection > .WorkflowSection-title,
    .Form-root .Section.WorkflowSection-fieldSetSection > .WorkflowSection-title p {
      color: ${theme.sys.color.surface.backgroundText};
      font-family: ${theme.sys.typography.title2.fontFamily};
      font-size: ${theme.sys.typography.title2.fontSize};
      font-weight: ${theme.sys.typography.title2.fontWeight};
      line-height: ${theme.sys.typography.title2.lineHeight};
    }
    .Form-root p {
      margin-bottom: 0;
    }
    .Form-root .CheckBox input,
    .Form-root .CheckGroup input,
    .Form-root .RadioGroup input {
      background: ${theme.sys.color.action.inputField.default};
      border-radius: ${theme.sys.shape.shape1};
      border-color: ${theme.sys.color.divider.inputField};
      border-width: 1px;
      width: 1rem;
    }
    .Form-root .CheckBox input:hover,
    .Form-root .CheckGroup input:hover {
      border-color: ${theme.sys.color.action.hover};
    }
    .Form-root .CheckBox input:checked,
    .Form-root .CheckGroup input:checked {
      background: ${theme.sys.color.primary.main};
      color: ${theme.sys.color.primary.text};
    }
    .Form-root .GeometryPicker .shape > div,
    .Form-root .Scanner .scanner-container .user-controls,
    .Form-root .FilePicker .file > div {
      display: flex;
      flex-direction: row;
    }
    .Form-root .CheckBox .items,
    .Form-root .CheckGroup .items label,
    .Form-root .RadioGroup .items label,
    .Form-root .GeometryPicker .add-shape,
    .Form-root .Numeric.Slider input[type='range'],
    .Form-root .DatePicker .outer,
    .Form-root .TimePicker .outer,
    .Form-root .DateTimePicker .outer,
    .Form-root .DateRangePicker .outer {
      display: flex;
    }
    .Form-root .CheckBox .items .inline p,
    .Form-root .CheckGroup .items label .inline p,
    .Form-root .RadioGroup .items label .inline p {
      margin: 0;
      line-height: 1;
      margin-left: 0.5rem;
    }
    .Form-root .FilePicker .add,
    .Form-root .GeometryPicker .add {
      background: ${theme.sys.color.primary.main};
      border-radius: ${theme.sys.shape.shape2};
      border-style: solid;
      border-width: 1px;
      border-color: ${theme.sys.color.primary.dark};
      font-size: ${theme.sys.typography.title3.fontSize};
      line-height: ${theme.sys.typography.title3.lineHeight};
      padding: ${theme.sys.spacing(1.5)} ${theme.sys.spacing(2)};
      color: ${theme.sys.color.primary.text};
      transition: background 0.5s ease;
      display: flex;
      align-items: center;
      flex: auto;
      margin-bottom: 0.25rem;
    }
    .Form-root .FilePicker .add-file .add:hover,
    .Form-root .GeometryPicker .add-shape.hover .add,
    .Form-root .Scanner .scanner-container .user-controls .scan:hover,
    .Form-root .DateTimePicker .outer button.calendarButton:hover,
    .Form-root .DateTimePicker .outer button.clockButton:hover,
    .Form-root .DatePicker .outer button.calendarButton:hover,
    .Form-root .DatePicker .outer button.clockButton:hover,
    .Form-root .TimePicker .outer button.calendarButton:hover,
    .Form-root .TimePicker .outer button.clockButton:hover,
    .Form-root .DateRangePicker .outer button.calendarButton:hover,
    .Form-root .DateRangePicker .outer button.clockButton:hover,
    .Section.collapsible-section > .form-element-title:hover,
    .Section.accordion-section > .form-element-title:hover {
      background: ${theme.sys.color.primary.dark};
    }
    .Form-root .FilePicker button.add:disabled,
    .Form-root .GeometryPicker button.add:disabled,
    .Form-root .GeometryPicker button.clear:disabled {
      background: ${theme.sys.color.action.disabled.default} !important;
      color: ${theme.sys.color.action.disabled.text} !important;
      border-color: ${theme.sys.color.divider.primary};
      border-width: 1px;
    }
    .Form-root .FilePicker .file .delete svg,
    .Form-root .GeometryPicker .shape .delete svg {
      width: 2em;
      height: 20px;
      margin-left: 0;
      vertical-align: text-top;
      text-align: center;
    }
    .Form-root .FilePicker svg .removeIcon,
    .Form-root .GeometryPicker svg .removeIcon {
      fill: ${theme.sys.color.action.text};
    }
    .Form-root .FilePicker p,
    .Form-root .GeometryPicker p {
      margin: 0;
    }
    .Form-root .FilePicker .file > div,
    .Form-root .GeometryPicker .shape > div {
      display: flex;
      width: 100%;
      margin-bottom: 0.375rem;
    }
    .Form-root .FilePicker .file label,
    .Form-root .GeometryPicker .shape label {
      flex: auto;
    }
    .Form-root .crossAdd {
      width: 10px;
      height: 10px;
      margin-right: 0.5rem;
    }
    .Form-root .crossAdd polyline {
      stroke: ${theme.sys.color.primary.text};
      stroke-width: 25;
    }
    .Form-root .GeometryPicker .shape button.delete,
    .Form-root .FilePicker .file button.delete {
      width: auto;
      height: 2.25em;
      cursor: pointer;
      padding: 0;
    }
    .Form-root .FilePicker .file label,
    .Form-root .GeometryPicker .shape label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 0.25rem;
    }
    .Form-root .GeometryPicker .shape.hover.checked label,
    .Form-root .GeometryPicker .shape.checked label {
      background: ${theme.sys.color.action.pressed} !important;
      color: ${theme.sys.color.action.text} !important;
      border-color: ${theme.sys.color.divider.primary};
      border-width: 1px;
    }
    .Form-root .AutoComplete.dropdown .relative,
    .Form-root .ItemPicker .filter-container,
    .Form-root .DateTimePicker .outer .buttonContainer,
    .Form-root .DatePicker .outer .buttonContainer,
    .Form-root .TimePicker .outer .buttonContainer,
    .Form-root .DateRangePicker .outer .buttonContainer,
    .Form-root .TimePickerInput .dropdown {
      position: relative;
    }
    .Form-root .AutoComplete.dropdown .relative .suggestions {
      position: absolute;
      width: 100%;
      max-height: 15.1em;
      margin: 0;
      padding: 0;
      list-style-type: none;
      overflow: auto;
      border-radius: ${theme.sys.shape.inputField};
      font-size: ${theme.sys.typography.inputField.fontSize};
      line-height: ${theme.sys.typography.inputField.lineHeight};
      padding: ${theme.sys.spacing(1)} ${theme.sys.spacing(2)};
      background: ${theme.sys.color.action.inputField.default};
      color: ${theme.sys.color.action.inputField.text} !important;
      border-color: ${theme.sys.color.divider.inputField};
      border-width: 1px;
      border-style: solid;
      z-index: 1;
    }
    .Form-root .AutoComplete .suggestions li {
      padding: 0.35em;
    }
    .Form-root .AutoComplete .suggestions li:hover,
    .Form-root .AutoComplete .suggestions li.selected {
      background: ${theme.sys.color.action.hover};
      color: ${theme.sys.color.action.text};
    }
    .Form-root .Scanner .scanner-container .user-controls .scan {
      height: 2.25em;
    }
    .Form-root .Scanner .scanner-container .user-controls .scan,
    .Form-root .DateTimePicker .outer button.calendarButton,
    .Form-root .DateTimePicker .outer button.clockButton,
    .Form-root .DatePicker .outer button.calendarButton,
    .Form-root .DatePicker .outer button.clockButton,
    .Form-root .TimePicker .outer button.calendarButton,
    .Form-root .TimePicker .outer button.clockButton,
    .Form-root .DateRangePicker .outer button.calendarButton,
    .Form-root .DateRangePicker .outer button.clockButton {
      border: none;
      transition: background 0.3s ease-in-out;
      cursor: pointer;
      margin: 0 0 0 12px;
      background: ${theme.sys.color.primary.main};
      font-size: medium;
      border-radius: ${theme.sys.shape.shape2};
    }
    .Form-root .Scanner .scanner-container .user-controls .scan svg {
      width: 2em;
      height: 20px;
    }
    .Form-root .DateTimePicker .outer button.calendarButton svg,
    .Form-root .DateTimePicker .outer button.clockButton svg,
    .Form-root .DatePicker .outer button.calendarButton svg,
    .Form-root .DatePicker .outer button.clockButton svg,
    .Form-root .TimePicker .outer button.calendarButton svg,
    .Form-root .TimePicker .outer button.clockButton svg,
    .Form-root .DateRangePicker .outer button.calendarButton svg,
    .Form-root .DateRangePicker .outer button.clockButton svg {
      width: 1.25rem;
      height: 1.625rem;
      padding: 0.075rem 0.15rem;
    }
    .Form-root .Scanner .scanner-container .user-controls .scan svg,
    .Form-root .DateTimePicker .outer button.calendarButton svg,
    .Form-root .DateTimePicker .outer button.clockButton svg,
    .Form-root .DatePicker .outer button.calendarButton svg,
    .Form-root .DatePicker .outer button.clockButton svg,
    .Form-root .TimePicker .outer button.calendarButton svg,
    .Form-root .TimePicker .outer button.clockButton svg,
    .Form-root .DateRangePicker .outer button.calendarButton svg,
    .Form-root .DateRangePicker .outer button.clockButton svg {
      stroke: ${theme.sys.color.primary.text};
      fill: ${theme.sys.color.primary.text};
      margin-left: 0;
      vertical-align: text-top;
      text-align: center;
    }
    .Form-root .ItemPicker input[type='text'] {
      display: inline-block;
      width: 100%;
      margin: 0.313em 0.5em 0.313em 0;
    }
    .Form-root .ItemPicker .items label,
    .Form-root .CheckGroup .items label,
    .Form-root .RadioGroup .items label {
      display: flex;
      align-items: center;
      padding: 0.5em;
      cursor: pointer;
    }
    .Form-root input[type='radio'] {
      margin-right: 0.25em;
      margin-left: 0.25em;
      margin-top: 0.15em;
      margin-bottom: 0.15em;
      vertical-align: baseline;
    }
    .Form-root .items input {
      width: auto;
    }
    .Form-root label.focus {
      background: ${theme.sys.color.action.focus};
      color: ${theme.sys.color.action.text};
    }
    .Form-root .ItemPicker .items label .inline,
    .Form-root .CheckGroup .items label .inline,
    .Form-root .RadioGroup .items label .inline {
      line-height: 1;
      margin-left: 0.5rem;
    }
    .Form-root .ItemPicker .items label:hover,
    .Form-root .CheckGroup .items label:hover,
    .Form-root .CheckBox label:hover,
    .Form-root .RadioGroup .items label:hover {
      background: ${theme.sys.color.action.hover};
      color: ${theme.sys.color.action.text};
    }
    .Form-root .Scanner .scanner-container .video-element {
      width: 100%;
      height: 75%;
      margin-bottom: 6px;
    }
    .Form-root .NumberSlider .NumberSlider-container,
    .Form-root .NumberRangeSlider .NumberRangeSlider-container {
      padding-left: 0.625rem;
      padding-right: 0.625rem;
      line-height: 1;
      margin-bottom: 0.5em;
    }
    .NumberSlider .inputs,
    .NumberRangeSlider .inputs {
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      margin-top: 1.5em;
    }
    .Form-root .CheckGroup .items,
    .Form-root .RadioGroup .items {
      display: flex;
      flex-direction: column;
    }
    .Form-root .CheckGroup .items.horizontal,
    .Form-root .RadioGroup .items.horizontal,
    .Form-root .ItemPicker .items.horizontal {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
    }
    .Form-root .ItemPicker .items.horizontal > label,
    .Form-root .CheckGroup .items.horizontal > label,
    .Form-root .RadioGroup .items.horizontal > label {
      margin: 0;
      flex: auto;
    }
    .Form-root .CheckBox label {
      padding: 0.5em;
    }
    .Form-root .ItemPicker > div > button {
      margin-right: 0.5em;
      margin-bottom: 0.5em;
    }
    .Form-root .ItemPicker .filter-container button:after {
      content: 'X';
      display: block;
      margin-top: -18px;
      font-size: 1em;
      z-index: 1000;
      text-indent: 0;
      line-height: 1.2;
    }
    .Form-root .ItemPicker .filter-container button {
      position: absolute;
      top: 8px;
      right: -3px;
      padding: 0 0.25em;
      text-indent: -9999px;
    }
    .Form-root .NumberRangeSlider .inputs span,
    .Form-root .NumberSlider .inputs span {
      margin-right: 0.5em;
      min-width: 7.5em;
    }
    .Form-root .DateTimePicker .outer .inner,
    .Form-root .DatePicker .outer .inner,
    .Form-root .TimePicker .outer .inner,
    .Form-root .DateRangePicker .outer .inner {
      display: flex;
      flex-grow: 1;
    }
    .Form-root .DateRangePicker .outer .inner input:first-child {
      border-right: 0;
    }
    .Form-root .DateRangePicker .outer .inner input:last-child {
      border-left: 0;
    }
    .Form-root .DateRangePicker .outer .inner .arrow {
      width: 3rem;
      background: ${theme.sys.color.action.inputField.default};
      border-color: ${theme.sys.color.divider.inputField};
      border-width: 1px;
      border-style: solid;
      border-left: 0;
      border-right: 0;
      display: flex;
      padding: 0.375rem 0.5rem 0.375rem 0;
    }
    .Form-root .DateRangePicker .outer .inner .arrow svg {
      fill: ${theme.sys.color.action.inputField.text} !important;
    }
    .Form-root .TimePickerInput .dropdown .rollers {
      position: absolute;
      visibility: hidden;
      background: ${theme.sys.color.action.inputField.default};
      border-radius: ${theme.sys.shape.inputField};
      text-align: center;
      box-sizing: border-box;
      box-shadow: ${theme.sys.shadow.shadow1};
      opacity: 0;
      transition: all 0.3s ease-in-out;
      z-index: 1;
      right: -2em;
      top: min(100vh - 8rem, 0.25em);
    }
    .Form-root .TimePickerInput .opened .rollers {
      visibility: visible;
      transition: all 0.3s ease-in-out;
      opacity: 1;
    }
    .Form-root .TimePickerInput .side {
      box-sizing: border-box;
      text-align: right;
      width: 100%;
    }
    .Form-root .TimePickerInput .main {
      display: flex;
      flex-direction: row;
      margin: 0.625em 0 1em;
    }
    .Form-root .TimePickerInput .hours,
    .Form-root .TimePickerInput .minutes,
    .Form-root .TimePickerInput .toggle {
      margin: 0 0.5em;
      position: relative;
    }
    .Form-root .TimePickerInput .hours,
    .Form-root .TimePickerInput .minutes {
      display: inline-block;
    }
    .Form-root .TimePickerInput .tape {
      display: none;
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      text-align: center;
      overflow-x: hidden;
      overflow-y: hidden;
    }
    .Form-root .TimePickerInput .marker {
      z-index: 1;
      top: 50%;
      left: 50%;
      width: 2.5em;
      height: 1.5em;
      margin-left: -1.2em;
      margin-top: -0.9em;
      border: solid ${theme.sys.color.primary.main} 3px;
    }
    .Form-root .TimePickerInput .up,
    .Form-root .TimePickerInput .down,
    .Form-root .TimePickerInput .value {
      position: relative;
      width: 1.4em;
      max-width: 1.4em;
      margin: 0 0.5em;
      border-radius: 50px;
    }
    .Form-root .DatePicker button,
    .Form-root .DateTimePicker button,
    .Form-root .TimePicker button,
    .Form-root .TimePickerInput .up .button,
    .Form-root .TimePickerInput .down .button {
      padding: 0;
    }
    .Form-root .DatePicker button,
    .Form-root .DateTimePicker button {
      padding-right: 8px;
    }
    .Form-root .TimePickerInput .up .symbol::after {
      content: '▲';
      font-size: 1.15em;
      color: ${theme.sys.color.primary.main};
    }
    .Form-root .TimePickerInput .value .button {
      line-height: 1.675em;
    }
    .Form-root .TimePickerInput .down .symbol::after {
      content: '▼';
      font-size: 1.15em;
      color: ${theme.sys.color.primary.main};
    }
    .Form-root .TimePickerInput .tape .item {
      position: relative;
      vertical-align: middle;
      line-height: 1;
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      -webkit-box-flex: 0;
      -ms-flex: 0 0 auto;
      flex: 0 0 auto;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      background: 0 0;
      padding: 0.92857143em 1.14285714em;
      text-transform: none;
      color: ${theme.sys.color.action.inputField.text};
      font-weight: 400;
      -webkit-transition:
        background 0.1s ease,
        box-shadow 0.1s ease,
        color 0.1s ease;
      transition:
        background 0.1s ease,
        box-shadow 0.1s ease,
        color 0.1s ease;
      border: solid ${theme.ref.palette.black} 1px;
      border-left: 0;
      border-right: 0;
    }
    .Form-root .TimePickerInput .tape,
    .Form-root .TimePickerInput .tape * {
      pointer-events: none;
    }
    .Form-root .TimePickerInput .up .button:hover .symbol::after,
    .Form-root .TimePickerInput .down .button:hover .symbol::after {
      color: ${theme.sys.color.primary.dark};
      transition: all 0.2s ease-in-out;
    }
    .Form-root .TimePickerInput .value .button:hover {
      border-radius: 50px;
      border-size: 1px;
      border-color: ${theme.sys.color.primary.dark};
      transition: all 0.2s ease-in-out;
    }
    .Form-root .TimePickerInput .bottom .button {
      cursor: default;
    }
    .Form-root .TimePickerInput .bottom .button:hover {
      background: none;
    }
    .Form-root .TimePickerInput .rolling .buttons {
      opacity: 0;
    }
    .Form-root .TimePickerInput .rolling .tape {
      display: block;
    }
    .Form-root .TimePickerInput .rollers .button {
      display: block;
      width: auto;
      text-align: center;
      cursor: pointer;
      font-size: small;
      transition: all 0.2s ease-in-out;
    }
    .Form-root .TimePickerInput .tape .item,
    .Form-root .TimePickerInput .tape .button {
      margin: 0;
      padding: 0;
    }
    .Form-root .SimpleDatePicker .rdrMonthAndYearPickers select,
    .DateRangePicker .rdrMonthAndYearPickers select {
      color: #3e484f !important;
    }
    .Form-root div.items button[disabled],
    .Form-root div.items button[disabled]:hover {
      cursor: default;
      color: ${theme.sys.color.action.disabled.text} !important;
      background: ${theme.sys.color.action.disabled.default} !important;
      border-color: ${theme.sys.color.divider.primary};
      border-width: 1px;
      border-style: solid;
      border-radius: ${theme.sys.shape.shape1};
    }
  `
}
