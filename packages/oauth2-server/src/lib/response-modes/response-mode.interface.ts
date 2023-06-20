import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { HttpResponse } from '../http/http.response';
import { ResponseMode } from './response-mode.type';

/**
 * Interface of a Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes
 */
export interface ResponseModeInterface {
  /**
   * Name of the Response Mode.
   */
  readonly name: ResponseMode;

  /**
   * Creates and returns a Http Response containing the Parameters of the Authorization Response.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the Authorization Response Parameters.
   */
  createHttpResponse(
    redirectUri: string,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>
  ): HttpResponse;
}
