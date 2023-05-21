import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Create Decision Interaction Request.
 */
export interface CreateDecisionInteractionRequest extends InteractionRequest {
  /**
   * Login Challenge provided by the Client.
   */
  readonly login_challenge: string;
}
