import { HttpResponse } from '../http/http.response';
import { AuthorizationResponse } from '../models/authorization-response';
import { ResponseMode } from '../types/response-mode';

/**
 * Interface with the Parameters of a Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes
 */
export interface IResponseMode {
  /**
   * Name of the Response Mode.
   */
  readonly name: ResponseMode;

  /**
   * Creates and returns an HTTP Response containing the Parameters of the Authorization Response.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns HTTP Response containing the Authorization Response Parameters.
   */
  createHttpResponse(redirectUri: string, parameters: AuthorizationResponse): HttpResponse;
}
