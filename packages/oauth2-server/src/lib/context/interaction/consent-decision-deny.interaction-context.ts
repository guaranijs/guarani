import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { ConsentDecisionInteractionContext } from './consent-decision.interaction-context';

/**
 * Parameters of the Consent Decision Deny Interaction Context.
 */
export interface ConsentDecisionDenyInteractionContext extends ConsentDecisionInteractionContext<'deny'> {
  /**
   * Interaction error.
   */
  readonly error: OAuth2Exception;
}
