import { Display } from '../../displays/display.type';
import { Prompt } from '../../types/prompt.type';

/**
 * Parameters of the Create Context.
 */
export interface CreateContext {
  /**
   * Prompts requested by the Client.
   */
  readonly prompts?: Prompt[];

  /**
   * Display requested by the Client.
   */
  readonly display?: Display;

  /**
   * End-User's preferred languages and scripts for the User Interface.
   */
  readonly ui_locales?: string[];
}
