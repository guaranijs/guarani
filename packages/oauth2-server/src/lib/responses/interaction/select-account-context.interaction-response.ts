import { Dictionary } from '@guarani/types';

import { SelectAccountContext } from './select-account.context';

/**
 * Parameters of the custom OAuth 2.0 Select Account Context Interaction Response.
 */
export interface SelectAccountContextInteractionResponse extends Dictionary<any> {
  /**
   * Logins Identifiers registered within the User-Agent's connection to the Authorization Server.
   */
  readonly logins: string[];

  /**
   * Context for the Select Account Interaction.
   */
  readonly context: SelectAccountContext;
}
