import { Prompt } from '../prompts/prompt.type';

/**
 * Parameters of the Login Context.
 */
export interface LoginContext extends Record<string, any> {
  /**
   * Prompts requested by the Client.
   */
  readonly prompts: Prompt[];
}
