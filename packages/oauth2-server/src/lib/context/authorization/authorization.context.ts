import { URL } from 'url';

import { DisplayInterface } from '../../displays/display.interface';
import { Client } from '../../entities/client.entity';
import { PromptInterface } from '../../prompts/prompt.interface';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';

/**
 * Parameters of the Authorization Context.
 */
export interface AuthorizationContext<T extends AuthorizationRequest> {
  /**
   * Parameters of the Authorization Request.
   */
  readonly parameters: T;

  /**
   * Cookies of the Http Request.
   */
  readonly cookies: Record<string, any>;

  /**
   * Response Type requested by the Client.
   */
  readonly responseType: ResponseTypeInterface;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Redirect URI provided by the Client.
   */
  readonly redirectUri: URL;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];

  /**
   * State of the Client prior to the Authorization Request.
   */
  readonly state?: string;

  /**
   * Response Mode used to generate the Authorization Response.
   */
  readonly responseMode: ResponseModeInterface;

  /**
   * Nonce provided by the Client to associate itself to a session and to prevent Replay Attacks.
   * This value is passed unmodified from the Authorization Request to the ID Token.
   */
  readonly nonce?: string;

  /**
   * Prompts requested by the Client.
   */
  readonly prompts: PromptInterface[];

  /**
   * Display used to present the interaction UIs to the End User.
   */
  readonly display: DisplayInterface;

  /**
   * Number of seconds since the User's last active authentication in which the Authorization Server
   * **MUST** actively try to re-authenticate the User.
   */
  readonly maxAge?: number;

  /**
   * Hint about the Identifier that the User might use for authentication.
   */
  readonly loginHint?: string;

  /**
   * ID Token used as a hint about the User that the Client expects to be authenticated.
   */
  readonly idTokenHint?: string;

  /**
   * End-User's preferred languages and scripts for the User Interface.
   */
  readonly uiLocales: string[];

  /**
   * Authentication Context Class References requested by the Client in order of preference.
   */
  readonly acrValues: string[];
}
