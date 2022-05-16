import { Dict, Optional } from '@guarani/types';

import { ResponseMode } from '../types/response-mode';
import { ResponseType } from '../types/response-type';

/**
 * Parameters of the OAuth 2.0 Authorization Request.
 */
export interface AuthorizationParameters extends Dict {
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
  readonly state?: Optional<string>;

  /**
   * Response Mode requested by the Client.
   */
  readonly response_mode?: Optional<ResponseMode>;
}
