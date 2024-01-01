import { URL } from 'url';

import { Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { HttpResponse } from '../http/http.response';
import { ResponseModeInterface } from './response-mode.interface';
import { ResponseMode } from './response-mode.type';

/**
 * Sanitizes an HTML string replacing the characteres used to perform XSS Attacks.
 *
 * @param html HTML string to be sanitized.
 * @returns Sanitized HTML string.
 */
function sanitizeHtml(html: string): string {
  const replacements: Dictionary<string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return html.replace(/[&<>"'/]/g, (substring) => replacements[substring] ?? substring);
}

/**
 * Returns a formatted html document to be used as the body of the Http Response.
 *
 * @param redirectUri Redirect URI that the User Agent will be redirected to.
 * @param parameters Authorization Response Parameters that will be returned to the Client Application.
 * @returns Formatted html document to be used as the body of the Http Response.
 */
const templateFn = (
  redirectUri: URL,
  parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
) => `
<!DOCTYPE html>
<html>
<head>
  <title>Authorizing...</title>
</head>
<body onload="document.forms[0].submit();">
  <form method="POST" action="${sanitizeHtml(redirectUri.href)}">
    ${Object.entries(parameters)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${sanitizeHtml(String(value))}" />`)
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
export class FormPostResponseMode implements ResponseModeInterface {
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
   * @param context Context of the Authorization Request.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the Authorization Response Parameters.
   */
  public async createHttpResponse(
    context: AuthorizationContext,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): Promise<HttpResponse> {
    const html = templateFn(context.redirectUri, removeNullishValues(parameters)).trim();
    return new HttpResponse().html(html);
  }
}
