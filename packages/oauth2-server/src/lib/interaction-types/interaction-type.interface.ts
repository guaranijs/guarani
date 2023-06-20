import { Json } from '@guarani/types';

import { InteractionContext } from '../context/interaction/interaction-context';
import { InteractionType } from './interaction-type.type';

/**
 * Interface of an Interaction Type.
 */
export interface InteractionTypeInterface {
  /**
   * Name of the Interaction Type.
   */
  readonly name: InteractionType;

  /**
   * Handles the Context Flow of the Interaction.
   *
   * @param context Interaction Context Request Context.
   * @returns Interaction Context Response.
   */
  handleContext(context: InteractionContext): Promise<Json>;

  /**
   * Handles the Decision Flow of the Interaction.
   *
   * @param context Interaction Decision Request Context.
   * @returns Interaction Decision Response.
   */
  handleDecision(context: InteractionContext): Promise<Json>;
}
