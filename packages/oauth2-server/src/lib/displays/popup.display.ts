import { Injectable } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { URL } from 'url';

import { HttpResponse } from '../http/http.response';
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

@Injectable()
export class PopupDisplay implements DisplayInterface {
  /**
   * Name of the Display.
   */
  public readonly name: Display = 'popup';

  /**
   * Creates a Http Response to the provided Redirect URI based on the provided Parameters.
   *
   * @param redirectUri Url to be redirected.
   * @param parameters Parameters used to build the Http Response.
   * @returns Http Response to the provided Redirect URI.
   */
  public createHttpResponse(redirectUri: string, parameters: Dictionary<any>): HttpResponse {
    const url = new URL(redirectUri);
    Object.entries(parameters).forEach(([name, value]) => url.searchParams.set(name, value));

    const html = templateFn(url.href).trim();
    return new HttpResponse().html(html);
  }
}
