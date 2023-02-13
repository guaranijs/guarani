import { LoginDecisionInteractionRequest } from './login-decision.interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Login Deny Decision Interaction Request.
 */
export interface LoginDecisionDenyInteractionRequest extends LoginDecisionInteractionRequest {
  /**
   * Error Code.
   */
  readonly error: string;

  /**
   * Description of the Error.
   */
  readonly error_description: string;
}
