import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Logout Context Interaction Request.
 */
export interface LogoutContextInteractionRequest extends InteractionRequest {
  /**
   * Logout Challenge provided by the Client.
   */
  readonly logout_challenge: string;
}
