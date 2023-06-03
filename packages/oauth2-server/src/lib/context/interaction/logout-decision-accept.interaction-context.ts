import { Session } from '../../entities/session.entity';
import { LogoutDecisionInteractionContext } from './logout-decision.interaction-context';

/**
 * Parameters of the Logout Decision Accept Interaction Context.
 */
export interface LogoutDecisionAcceptInteractionContext extends LogoutDecisionInteractionContext<'accept'> {
  /**
   * Session based on the Identifier provided by the Client.
   */
  readonly session: Session;
}
