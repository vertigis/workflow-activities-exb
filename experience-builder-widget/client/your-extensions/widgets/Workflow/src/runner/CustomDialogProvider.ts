import DialogProvider from '@vertigis/workflow/activities/ui/DialogProvider'
import type { Engine } from '@vertigis/workflow/execution/Engine'
import type UIService from '@vertigis/workflow/ui/UIService'

export function register(engine: Engine, uiService: UIService) {
  class CustomDialogProvider extends DialogProvider {
    static create(getText: (key: string) => string): DialogProvider {
      const provider = new this(getText)
      provider.uiService = uiService
      return provider
    }
  }

  ;(engine.trivia as any)['DialogProvider'] = CustomDialogProvider
  CustomDialogProvider.register(engine.activator)
}
