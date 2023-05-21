import { Grant } from '../../entities/grant.entity';
import { CreateDecisionInteractionRequest } from '../../requests/interaction/create-decision.interaction-request';
import { InteractionContext } from './interaction.context';

/**
 * Parameters of the Create Decision Interaction Context.
 */
export interface CreateDecisionInteractionContext extends InteractionContext<CreateDecisionInteractionRequest> {
  /**
   * Grant based on the Login Challenge provided by the Client.
   */
  readonly grant: Grant;
}
