import { InteractionRequest } from '../requests/interaction/interaction-request';
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
   * @param parameters Parameters of the Interaction Context Request.
   * @returns Parameters of the Interaction Context Response.
   */
  handleContext(parameters: InteractionRequest): Promise<Record<string, any>>;

  /**
   * Handles the Decision Flow of the Interaction.
   *
   * @param parameters Parameters of the Interaction Decision Request.
   * @returns Parameters of the Interaction Decision Response.
   */
  handleDecision(parameters: InteractionRequest): Promise<Record<string, any>>;
}
