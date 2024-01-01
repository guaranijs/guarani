import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
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
   * @param context Context of the Authorization Request.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the Authorization Response Parameters.
   */
  createHttpResponse(
    context: AuthorizationContext,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): Promise<HttpResponse>;
}
