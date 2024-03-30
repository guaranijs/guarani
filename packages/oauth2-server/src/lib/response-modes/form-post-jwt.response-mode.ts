import { URL } from 'url';

import { Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { AuthorizationResponseTokenHandler } from '../handlers/authorization-response-token.handler';
import { HttpResponse } from '../http/http.response';
import { Logger } from '../logger/logger';
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
 * @param token JSON Web Token Authorization Response Token containing the parameters of the authorization response.
 * @returns Formatted html document to be used as the body of the Http Response.
 */
const templateFn = (redirectUri: URL, token: string) => `
<!DOCTYPE html>
<html>
<head>
  <title>Authorizing...</title>
</head>
<body onload="document.forms[0].submit();">
  <form method="POST" action="${sanitizeHtml(redirectUri.href)}">
    <input type="hidden" name="response" value="${token}" />
    <noscript>
      <p>Your browser does not support javascript or it is disabled.</p>
      <button autofocus type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>
`;

/**
 * Implementation of the **Form Post JSON Web Token** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-jarm.html#section-2.3.3
 */
@Injectable()
export class FormPostJwtResponseMode implements ResponseModeInterface {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'form_post.jwt';

  /**
   * Instantiates a new Form Post JSON Web Token Response Mode.
   *
   * @param logger Logger of the Authorization Server.
   * @param authorizationResponseTokenHandler Instance of the JSON Web Token Authorization Response Token Handler.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly authorizationResponseTokenHandler: AuthorizationResponseTokenHandler,
  ) {}

  /**
   * Creates an HTML form with its action as the Redirect URI and its **response** field as a hidden input
   * containing a JSON Web Token with the provided Authorization Response Parameters.
   *
   * If the User-Agent supports Javascript, the form is automatically submitted as soon as the page finishes loading,
   * otherwise, a submit button is displayed for the manual redirection.
   *
   * @param context Context of the Authorization Request.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the JSON Web Token with the Authorization Response Parameters.
   */
  public async createHttpResponse(
    context: AuthorizationContext,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): Promise<HttpResponse> {
    this.logger.debug(
      `[${this.constructor.name}] Called createHttpResponse()`,
      'f1e76172-154f-4074-84a8-bf69cd189c66',
      { context, parameters },
    );

    const token = await this.authorizationResponseTokenHandler.generateAuthorizationResponseToken(
      context,
      removeNullishValues(parameters),
    );

    const html = templateFn(context.redirectUri, token).trim();

    return new HttpResponse().html(html);
  }
}
