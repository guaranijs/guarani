import { Grant } from '../../entities/grant.entity';
import { Session } from '../../entities/session.entity';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Select Account Context Interaction Context.
 */
export interface SelectAccountContextInteractionContext extends InteractionContext {
  /**
   * Grant based on the Login Challenge provided by the Client.
   */
  readonly grant: Grant;

  /**
   * Session of the User-Agent.
   */
  readonly session: Session;
}
