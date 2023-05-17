import { LogoutDecision } from '../../interaction-types/logout-decision.type';
import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Logout Decision Interaction Request.
 */
export interface LogoutDecisionInteractionRequest<TDecision extends LogoutDecision> extends InteractionRequest {
  /**
   * Logout Challenge provided by the Client.
   */
  readonly logout_challenge: string;

  /**
   * Decision regarding the End User Logout.
   */
  readonly decision: TDecision;
}
