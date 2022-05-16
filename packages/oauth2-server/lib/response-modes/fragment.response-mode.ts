import { Injectable } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { HttpResponse } from '../http/http.response';
import { AuthorizationResponse } from '../models/authorization-response';
import { ResponseMode } from '../types/response-mode';
import { IResponseMode } from './response-mode.interface';

/**
 * Implementation of the **Fragment** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes
 */
@Injectable()
export class FragmentResponseMode implements IResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'fragment';

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters at the Fragment of the URI.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns HTTP Response containing the Authorization Response Parameters.
   */
  public createHttpResponse(redirectUri: string, parameters: AuthorizationResponse): HttpResponse {
    const url = new URL(redirectUri);
    const fragmentParams = new URLSearchParams(parameters);

    url.hash = fragmentParams.toString();

    return new HttpResponse().redirect(url.href);
  }
}
