import { LogoutDecisionInteractionRequest } from './logout-decision.interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Logout Decision Accept Interaction Request.
 */
export interface LogoutDecisionAcceptInteractionRequest extends LogoutDecisionInteractionRequest<'accept'> {
  /**
   * Logout Challenge provided by the Client.
   */
  readonly logout_challenge: string;

  /**
   * Session Identifier selected by the End User.
   */
  readonly session_id: string;
}
