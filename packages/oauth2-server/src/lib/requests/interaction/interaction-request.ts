import { Dictionary } from '@guarani/types';

import { InteractionType } from '../../interaction-types/interaction-type.type';

/**
 * Parameters of the custom OAuth 2.0 Interaction Request.
 */
export interface InteractionRequest extends Dictionary<any> {
  /**
   * Interaction Type requested by the Client.
   */
  readonly interaction_type: InteractionType;
}
