/**
 * Parameters of the OAuth 2.0 End Session Request.
 */
export interface EndSessionRequest extends Record<string, any> {
  /**
   * ID Token used as a hint about the User that the Client expects to be authenticated.
   */
  readonly id_token_hint: string;

  /**
   * Identifier of the Client.
   */
  readonly client_id: string;

  /**
   * Post Logout Redirect URI provided by the Client.
   */
  readonly post_logout_redirect_uri: string;

  /**
   * State of the Client Application prior to the End Session Request.
   */
  readonly state?: string;

  /**
   * Hint to the Authorization Server about the User being logged out.
   */
  readonly logout_hint?: string;

  /**
   * End-User's preferred languages and scripts for the User Interface.
   */
  readonly ui_locales?: string;
}
