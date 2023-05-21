/**
 * Parameters of the custom OAuth 2.0 Create Decision Interaction Response.
 */
export interface CreateDecisionInteractionResponse {
  /**
   * Redirect Url used by the User-Agent to continue the Authorization Process.
   */
  readonly redirect_to: string;
}
