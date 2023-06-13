import { URLSearchParams } from 'url';

import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';

/**
 * Parameters of the Interaction Context.
 */
export interface InteractionContext {
  /**
   * Parameters of the Interaction Context.
   */
  readonly parameters: URLSearchParams;

  /**
   * Interaction Type requested by the Client.
   */
  readonly interactionType: InteractionTypeInterface;
}
