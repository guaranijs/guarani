import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { InteractionRequest } from '../../requests/interaction/interaction-request';

/**
 * Parameters of the Interaction Context.
 */
export interface InteractionContext<T extends InteractionRequest> {
  /**
   * Parameters of the Interaction Context.
   */
  readonly parameters: T;

  /**
   * Cookies of the Request.
   */
  readonly cookies: Record<string, any>;

  /**
   * Interaction Type requested by the Client.
   */
  readonly interactionType: InteractionTypeInterface;
}
