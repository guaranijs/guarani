import { Dictionary } from '@guarani/types';

/**
 * Parameters of the custom OAuth 2.0 Consent Decision Interaction Response.
 */
export interface ConsentDecisionInteractionResponse extends Dictionary<any> {
  /**
   * Redirect Url used by the User-Agent to continue the Authorization Process.
   */
  readonly redirect_to: string;
}
