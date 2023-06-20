import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { InteractionRequest } from '../../requests/interaction/interaction-request';

/**
 * Parameters of the Interaction Context.
 */
export interface InteractionContext<TRequest extends InteractionRequest = InteractionRequest> {
  /**
   * Parameters of the Interaction Context.
   */
  readonly parameters: TRequest;

  /**
   * Interaction Type requested by the Client.
   */
  readonly interactionType: InteractionTypeInterface;
}
