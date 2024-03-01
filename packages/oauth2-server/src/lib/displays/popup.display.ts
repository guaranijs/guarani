import { Injectable } from '@guarani/di';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { HttpResponse } from '../http/http.response';
import { Logger } from '../logger/logger';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { DisplayInterface } from './display.interface';
import { Display } from './display.type';

/**
 * Returns a formatted html document to be used as the body of the Http Response.
 *
 * @param redirectUri Redirect URI that the User Agent will be redirected to.
 * @returns Formatted html document to be used as the body of the Http Response.
 */
const templateFn = (redirectUri: string) => `
<!DOCTYPE html>
<html>
  <head></head>
  <body onload="openWindow('${redirectUri}');">
    <script type="text/javascript">
      function callback(redirectTo) {
        window.location.replace(redirectTo);
      }

      function openWindow(url) {
        const top = Math.floor((window.outerHeight - 640) / 2);
        const left = Math.floor((window.outerWidth - 360) / 2);

        window.open(url, '_blank', \`top=\${top},left=\${left},width=360,height=640\`);
      }
    </script>
  </body>
</html>
`;

/**
 * Implementation of the **Popup** Display.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
@Injectable()
export class PopupDisplay implements DisplayInterface {
  /**
   * Name of the Display.
   */
  public readonly name: Display = 'popup';

  /**
   * Instantiates a new Popup Display.
   *
   * @param logger Logger of the Authorization Server.
   */
  public constructor(private readonly logger: Logger) {}

  /**
   * Creates a Http Response to the provided Redirect URI based on the provided Parameters.
   *
   * @param redirectUri Url to be redirected.
   * @param parameters Parameters used to build the Http Response.
   * @returns Http Response to the provided Redirect URI.
   */
  public createHttpResponse(
    redirectUri: string,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): HttpResponse {
    this.logger.debug(
      `[${this.constructor.name}] Called createHttpResponse()`,
      'b3af8410-9e82-42b7-80dc-d19b4d595265',
      { redirect_uri: redirectUri, parameters },
    );

    const url = addParametersToUrl(redirectUri, parameters);
    const html = templateFn(url.href).trim();

    const response = new HttpResponse().html(html);

    this.logger.debug(
      `[${this.constructor.name}] Completed createHttpResponse()`,
      '7eab86b9-068b-446b-bcf2-b01f56bddafb',
      { response },
    );

    return response;
  }
}
