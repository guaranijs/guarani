import { LogoutDecisionInteractionRequest } from './logout-decision.interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Logout Deny Decision Interaction Request.
 */
export interface LogoutDecisionDenyInteractionRequest extends LogoutDecisionInteractionRequest<'deny'> {
  /**
   * Error Code.
   */
  readonly error: string;

  /**
   * Description of the Error.
   */
  readonly error_description: string;
}
