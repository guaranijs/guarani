import { Dictionary } from '@guarani/types';

/**
 * Parameters of the custom OAuth 2.0 Logout Decision Interaction Response.
 */
export interface LogoutDecisionInteractionResponse extends Dictionary<any> {
  /**
   * Redirect Url used by the User-Agent to continue the Logout Process.
   */
  readonly redirect_to: string;
}
