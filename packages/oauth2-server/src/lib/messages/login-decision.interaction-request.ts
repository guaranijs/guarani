import { LoginDecision } from '../interaction-types/login-decision.type';
import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Login Decision Interaction Request.
 */
export interface LoginDecisionInteractionRequest extends InteractionRequest {
  /**
   * Login Challenge.
   */
  readonly login_challenge: string;

  /**
   * Decision regarding the End User Authentication.
   */
  readonly decision: LoginDecision;
}
