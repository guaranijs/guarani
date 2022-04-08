import { Dict } from '@guarani/types';

import { Response } from '../http/response';
import { SupportedResponseMode } from './types/supported-response-mode';

/**
 * Interface with the Parameters of a **Response Mode** defined by
 * {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes OAuth 2.0 Multiple Response Type Encoding Practices}.
 */
export interface ResponseMode {
  /**
   * Name of the Response Mode.
   */
  readonly name: SupportedResponseMode;

  /**
   * Creates and returns an HTTP Response containing the Parameters of the Authorization Response.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param params Authorization Response Parameters that will be returned to the Client Application.
   * @returns HTTP Response containing the Authorization Response Parameters.
   */
  createHttpResponse(redirectUri: string, params: Dict): Response;
}
