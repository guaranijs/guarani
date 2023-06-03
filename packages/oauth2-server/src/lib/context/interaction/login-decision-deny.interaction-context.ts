import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { LoginDecisionInteractionContext } from './login-decision.interaction-context';

/**
 * Parameters of the Login Decision Deny Interaction Context.
 */
export interface LoginDecisionDenyInteractionContext extends LoginDecisionInteractionContext<'deny'> {
  /**
   * Interaction error.
   */
  readonly error: OAuth2Exception;
}
