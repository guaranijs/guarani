import { Prompt } from '../prompts/prompt.type';

/**
 * Parameters of the Consent Context.
 */
export interface ConsentContext extends Record<string, any> {
  /**
   * Prompts requested by the Client.
   */
  readonly prompts: Prompt[];
}
