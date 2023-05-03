/**
 * Settings to customize the User Interaction.
 */
export interface UserInteractionSettings {
  /**
   * Url of the Consent Page.
   */
  readonly consentUrl: string;

  /**
   * URL of the Error Page.
   */
  readonly errorUrl: string;

  /**
   * URL of the Login Page.
   */
  readonly loginUrl: string;

  /**
   * URL of the Select Account Page.
   */
  readonly selectAccountUrl: string;
}
