import { Injectable } from '@guarani/ioc'
import { Dict } from '@guarani/utils'

import { SupportedResponseMode } from '../constants'
import { HtmlResponse } from '../context'
import { ResponseMode } from './response-mode'

/**
 * Definition of the Form Post Response Mode.
 */
@Injectable()
export class FormPostResponseMode implements ResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name = SupportedResponseMode.FormPost

  /**
   * Creates an HTML form with it's action as the Redirect URI and the fields
   * as hidden inputs containing the parameters of the provided data.
   *
   * This form automatically submits as soon as the page finishes loading.
   *
   * @param redirectUri URI to where the User-Agent will be redirected to.
   * @param data Data to be included at the Redirect Response.
   * @returns Redirect Response.
   */
  public createResponse(redirectUri: string, data: Dict): HtmlResponse {
    const params = Object.entries(data).reduce(
      (inputs, [name, value]) =>
        (inputs += `<input type="hidden" name="${name}" value="${value}">`),
      ''
    )

    const body = String.raw`
    <!DOCTYPE html>
    <html>
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
