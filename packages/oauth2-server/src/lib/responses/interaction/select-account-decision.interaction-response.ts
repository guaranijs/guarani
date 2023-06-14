import { Dictionary } from '@guarani/types';

/**
 * Parameters of the custom OAuth 2.0 Select Account Decision Interaction Response.
 */
export interface SelectAccountDecisionInteractionResponse extends Dictionary<unknown> {
  /**
   * Redirect Url used by the User-Agent to continue the Authorization Process.
   */
  readonly redirect_to: string;
}
