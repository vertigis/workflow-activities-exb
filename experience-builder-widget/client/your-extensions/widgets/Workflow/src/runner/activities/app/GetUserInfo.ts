import { type EmptyInputs, type IActivityContext } from '@vertigis/workflow/IActivityHandler'
import { type GetUserInfoOutputs } from '@vertigis/workflow/activities/app/GetUserInfo'
import { portalUrlUtils } from 'jimu-core'
import type PortalUser from 'esri/portal/PortalUser'

export class GetUserInfoEXB {
  execute(inputs: EmptyInputs, context: IActivityContext): GetUserInfoOutputs {
    const trivia: any = context.ambient.trivia
    const portalUrl = trivia.widget.portalUrl
    const standardPortalUrl = portalUrlUtils.getStandardPortalUrl(portalUrl)
    const result: GetUserInfoOutputs = {
      username: undefined,
      email: undefined,
      roles: []
    }
    if (standardPortalUrl) {
      let user: PortalUser
      try {
        user = trivia.widget.user
        if (user) {
          result.username = user.username
          result.email = user.email
          result.roles = [user.role]
        }
      } catch (e) {
        console.warn(e)
      }
    }
    return result
  }
}
