/**
 * Settings to customize the User Interaction.
 */
export interface UserInteractionSettings {
  /**
   * Url of the Consent Page.
   */
  readonly consentUrl: string;

  /**
   * Url of the Device Code Interaction Page.
   */
  readonly deviceCodeUrl: string;

  /**
   * Url of the Error Page.
   */
  readonly errorUrl: string;

  /**
   * Url of the Login Page.
   */
  readonly loginUrl: string;

  /**
   * Url of the Logout Page.
   */
  readonly logoutUrl: string;

  /**
   * Url of the Registration Page.
   */
  readonly registrationUrl: string;

  /**
   * Url of the Select Account Page.
   */
  readonly selectAccountUrl: string;
}
