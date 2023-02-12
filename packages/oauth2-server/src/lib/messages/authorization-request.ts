import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseType } from '../response-types/response-type.type';

/**
 * Parameters of the OAuth 2.0 Authorization Request.
 */
export interface AuthorizationRequest extends Record<string, any> {
  /**
   * Response Type requested by the Client.
   */
  readonly response_type: ResponseType;

  /**
   * Identifier of the Client.
   */
  readonly client_id: string;

  /**
   * Redirect URI provided by the Client.
   */
  readonly redirect_uri: string;

  /**
   * Scope requested by the Client.
   */
  readonly scope: string;

  /**
   * State of the Client Application prior to the Authorization Request.
   */
  readonly state?: string;

  /**
   * Response Mode requested by the Client.
   */
  readonly response_mode?: ResponseMode;
}
