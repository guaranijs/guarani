import { Grant } from '../../entities/grant.entity';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Create Decision Interaction Context.
 */
export interface CreateDecisionInteractionContext extends InteractionContext {
  /**
   * Grant based on the Login Challenge provided by the Client.
   */
  readonly grant: Grant;
}
