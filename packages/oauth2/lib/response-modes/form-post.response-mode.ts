import { Dict } from '@guarani/utils'

import { SupportedResponseMode } from '../constants'
import { HtmlResponse } from '../context'
import { ResponseMode } from './response-mode'

export class FormPostResponseMode implements ResponseMode {
  public readonly name: SupportedResponseMode = 'form_post'

  public createResponse(redirectUri: string, data: Dict): HtmlResponse {
    const params = Object.entries(data).reduce(
      (inputs, [name, value]) =>
        (inputs += `<input type="hidden" name="${name}" value="${value}">`),
      ''
    )

    const body = String.raw`
    <!DOCTYPE html>
    <html lang="en-us">
    <head>
      <title>Authorizing...</title>
    </head>
    <body onload="document.forms[0].submit();">
      <form method="post" action="${redirectUri}">
        ${params}
      </form>
    </body>
    </html>
    `

    return new HtmlResponse(body)
  }
}
