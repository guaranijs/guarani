import { Grant } from '../../entities/grant.entity';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Consent Context Interaction Context.
 */
export interface ConsentContextInteractionContext extends InteractionContext {
  /**
   * Grant based on the Consent Challenge provided by the Client.
   */
  readonly grant: Grant;
}
