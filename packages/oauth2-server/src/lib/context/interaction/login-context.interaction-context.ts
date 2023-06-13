import { Grant } from '../../entities/grant.entity';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Login Context Interaction Context.
 */
export interface LoginContextInteractionContext extends InteractionContext {
  /**
   * Grant based on the Login Challenge provided by the Client.
   */
  readonly grant: Grant;
}
