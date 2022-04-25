import { Dict, Optional } from '@guarani/types';

import { SupportedResponseMode } from '../../response-modes/types/supported-response-mode';
import { SupportedResponseType } from './supported-response-type';

/**
 * Defines the default parameters of the Authorization Request.
 */
export interface AuthorizationParameters extends Dict {
  /**
   * Response Type requested by the Client.
   */
  readonly response_type: SupportedResponseType;

  /**
   * Identifier of the Client requesting authorization.
   */
  readonly client_id: string;

  /**
   * Redirect URI of the Client.
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
  readonly response_mode?: Optional<SupportedResponseMode>;
}
