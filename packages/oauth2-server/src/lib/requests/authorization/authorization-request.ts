import { Display } from '../../displays/display.type';
import { ResponseMode } from '../../response-modes/response-mode.type';
import { ResponseType } from '../../response-types/response-type.type';

/**
 * Parameters of the OAuth 2.0 Authorization Request.
 */
export interface AuthorizationRequest extends Record<string, any> {
  /**
   * Response Type requested by the Client.
   */
  readonly response_type: ResponseType;

  /**
   * Identifier of the Client.
   */
  readonly client_id: string;

  /**
   * Redirect URI provided by the Client.
   */
  readonly redirect_uri: string;

  /**
   * Scope requested by the Client.
   */
  readonly scope: string;

  /**
   * State of the Client Application prior to the Authorization Request.
   */
  readonly state?: string;

  /**
   * Response Mode requested by the Client.
   */
  readonly response_mode?: ResponseMode;

  /**
   * Nonce provided by the Client to associate itself to a session and to prevent Replay Attacks.
   * This value is passed unmodified from the Authorization Request to the ID Token.
   */
  readonly nonce?: string;

  /**
   * Space delimited list of Prompt values requested by the Client.
   */
  readonly prompt?: string;

  /**
   * Display requested by the Client.
   */
  readonly display?: Display;

  /**
   * Number of seconds since the User's last active authentication in which the Authorization Server
   * **MUST** actively try to re-authenticate the User.
   */
  readonly max_age?: string;

  /**
   * Hint about the Identifier that the User might use for authentication.
   */
  readonly login_hint?: string;

  /**
   * ID Token used as a hint about the User that the Client expects to be authenticated.
   */
  readonly id_token_hint?: string;

  /**
   * End-User's preferred languages and scripts for the User Interface.
   */
  readonly ui_locales?: string;

  /**
   * Space delimited list of Authentication Context Class References requested by the Client in order of preference.
   */
  readonly acr_values?: string;
}
