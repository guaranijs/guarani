import { LogoutType } from '../../logout-types/logout-type.type';
import { LogoutDecisionInteractionRequest } from './logout-decision.interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Logout Decision Accept Interaction Request.
 */
export interface LogoutDecisionAcceptInteractionRequest<TLogoutType extends LogoutType = LogoutType>
  extends LogoutDecisionInteractionRequest<'accept'> {
  /**
   * Session Identifier selected by the End User.
   */
  readonly session_id: string;

  /**
   * Logout Type to be performed.
   */
  readonly logout_type: TLogoutType;
}
