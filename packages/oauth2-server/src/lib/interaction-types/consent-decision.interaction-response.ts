/**
 * Parameters of the custom OAuth 2.0 Consent Decision Interaction Response.
 */
export interface ConsentDecisionInteractionResponse {
  /**
   * Redirect Url used by the User-Agent to continue the Authorization Process.
   */
  readonly redirect_to: string;
}
