/** @jsx jsx */
import { IMThemeVariables, jsx, type React } from 'jimu-core'
import UIService from '@vertigis/workflow/ui/UIService'
import { getStyles } from '../runtime/styles'
import { FormThemeProvider, setFormTheme } from './formTheme'

export class CustomUIService extends UIService {
  private theme: IMThemeVariables
  private id: string
  constructor(rootElementId: string, id: string, theme: IMThemeVariables) {
    super(rootElementId)
    this.theme = theme
    this.id = id
    setFormTheme(id, theme)
  }

  wrapProviders = (content: React.JSX.Element) => {
    return (
      <FormThemeProvider widgetId={this.id}>
        <div css={getStyles(this.theme, '', this.id)}>{content}</div>
      </FormThemeProvider>
    )
  }
}
