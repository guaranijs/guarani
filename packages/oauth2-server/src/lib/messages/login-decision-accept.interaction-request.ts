import { LoginDecisionInteractionRequest } from './login-decision.interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Login Accept Decision Interaction Request.
 */
export interface LoginDecisionAcceptInteractionRequest extends LoginDecisionInteractionRequest {
  /**
   * Identifier of the Subject of the Authentication.
   */
  readonly subject: string;
}
