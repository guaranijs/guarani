import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Select Account Decision Interaction Request.
 */
export interface SelectAccountDecisionInteractionRequest extends InteractionRequest {
  /**
   * Login Challenge provided by the Client.
   */
  readonly login_challenge: string;

  /**
   * Login Identifier selected by the End User.
   */
  readonly login_id: string;
}
