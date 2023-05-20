import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { LogoutDecisionInteractionContext } from './logout-decision.interaction.context';

/**
 * Parameters of the Logout Decision Deny Interaction Context.
 */
export interface LogoutDecisionDenyInteractionContext extends LogoutDecisionInteractionContext<'deny'> {
  /**
   * Interaction error.
   */
  readonly error: OAuth2Exception;
}
