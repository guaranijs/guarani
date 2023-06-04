import { Injectable } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { URL, URLSearchParams } from 'url';

import { HttpResponse } from '../http/http.response';
import { ResponseMode } from './response-mode.type';
import { ResponseModeInterface } from './response-mode.interface';

/**
 * Implementation of the **Fragment** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes
 */
@Injectable()
export class FragmentResponseMode implements ResponseModeInterface {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'fragment';

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters at the Fragment of the URI.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the Authorization Response Parameters.
   */
  public createHttpResponse(redirectUri: string, parameters: Dictionary<any>): HttpResponse {
    const url = new URL(redirectUri);
    const fragmentParameters = new URLSearchParams(parameters);

    url.hash = fragmentParameters.toString();

    return new HttpResponse().redirect(url);
  }
}
