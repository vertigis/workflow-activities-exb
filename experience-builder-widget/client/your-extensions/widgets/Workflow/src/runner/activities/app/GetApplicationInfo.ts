import { type EmptyInputs, type IActivityContext } from '@vertigis/workflow/IActivityHandler'
import { type GetApplicationInfoOutputs } from '@vertigis/workflow/activities/app/GetApplicationInfo'
export class GetApplicationInfoEXB {
  execute(inputs: EmptyInputs, context: IActivityContext): GetApplicationInfoOutputs {
    const trivia: any = context.ambient.trivia
    return {
      name: 'EXB',
      version: trivia.widget.appConfig.exbVersion,
      info: trivia.widget.appInfo
    }
  }
}
