import { Injectable } from '@guarani/ioc';
import { Dict } from '@guarani/types';
import { sanitizeHtml } from '@guarani/utils';

import { Response } from '../http/response';
import { ResponseMode } from './response-mode';
import { SupportedResponseMode } from './types/supported-response-mode';

const templateFn = (redirectUri: string, params: Dict) => `
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
 * Implementation of the Form Post Response Mode as defined by
 * {@link https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html#FormPostResponseMode OAuth 2.0 Form Post Response Mode}.
 */
@Injectable()
export class FormPostResponseMode implements ResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name: SupportedResponseMode = 'form_post';

  /**
   * Creates an HTML form with its action as the Redirect URI and its fields as hidden inputs
   * containing the provided Parameters.
   *
   * This form is automatically submitted as soon as the page finishes loading.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param params Authorization Response Parameters that will be returned to the Client Application.
   * @returns HTTP Response containing the Authorization Response Parameters.
   */
  public createHttpResponse(redirectUri: string, params: Dict): Response {
    const html = templateFn(redirectUri, params).slice(1, -1);
    return new Response().html(html);
  }
}
