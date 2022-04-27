import { Injectable } from '@guarani/di';
import { sanitizeHtml } from '@guarani/utils';

import { HttpResponse } from '../http/http.response';
import { AuthorizationResponse } from '../models/authorization-response';
import { ResponseMode } from '../types/response-mode';
import { IResponseMode } from './response-mode.interface';

const templateFn = (redirectUri: string, params: AuthorizationResponse) => `
<!DOCTYPE html>
<html>
<head>
  <title>Authorizing...</title>
</head>
<body onload="document.forms[0].submit();">
  <form method="POST" action="${sanitizeHtml(redirectUri)}">
    ${Object.entries(params)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${sanitizeHtml(value)}" />`)
      .join('\n    ')}
    <noscript>
      <p>Your browser does not support javascript or it is disabled.</p>
      <button autofocus type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>
`;

/**
 * Implementation of the **Form Post** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html#FormPostResponseMode
 */
@Injectable()
export class FormPostResponseMode implements IResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'form_post';

  /**
   * Creates an HTML form with its action as the Redirect URI and its fields as hidden inputs
   * containing the provided Authorization Response Parameters.
   *
   * If the User-Agent supports Javascript, the form is automatically submitted as soon as the page finishes loading,
   * otherwise, a submit button is displayed for the manual redirection.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns HTTP Response containing the Authorization Response Parameters.
   */
  public createHttpResponse(redirectUri: string, parameters: AuthorizationResponse): HttpResponse {
    const html = templateFn(redirectUri, parameters).slice(1, -1);
    return new HttpResponse().html(html);
  }
}
