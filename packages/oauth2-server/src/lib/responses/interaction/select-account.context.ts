import { Display } from '../../displays/display.type';
import { Prompt } from '../../types/prompt.type';

/**
 * Parameters of the Select Account Context.
 */
export interface SelectAccountContext extends Record<string, any> {
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
