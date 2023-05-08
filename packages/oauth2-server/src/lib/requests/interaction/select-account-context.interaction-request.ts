import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Select Account Context Interaction Request.
 */
export interface SelectAccountContextInteractionRequest extends InteractionRequest {
  /**
   * Login Challenge provided by the Client.
   */
  readonly login_challenge: string;

  /**
   * Identifier of the Session.
   */
  readonly session_id: string;
}
