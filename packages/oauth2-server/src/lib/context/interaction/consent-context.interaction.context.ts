import { Grant } from '../../entities/grant.entity';
import { ConsentContextInteractionRequest } from '../../requests/interaction/consent-context.interaction-request';
import { InteractionContext } from './interaction.context';

/**
 * Parameters of the Consent Context Interaction Context.
 */
export interface ConsentContextInteractionContext extends InteractionContext<ConsentContextInteractionRequest> {
  /**
   * Grant based on the Consent Challenge provided by the Client.
   */
  readonly grant: Grant;
}
