import { URL } from 'url';

import { Client } from '../entities/client.entity';
import { EndSessionRequest } from '../requests/end-session-request';

/**
 * Parameters of the End Session Context.
 */
export interface EndSessionContext {
  /**
   * Parameters of the End Session Request.
   */
  readonly parameters: EndSessionRequest;

  /**
   * ID Token used as a hint about the User that the Client expects to be authenticated.
   */
  readonly idTokenHint: string;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Post Logout Redirect URI provided by the Client.
   */
  readonly postLogoutRedirectUri: URL;

  /**
   * State of the Client prior to the End Session Request.
   */
  readonly state?: string;

  /**
   * Hint to the Authorization Server about the User being logged out.
   */
  readonly logoutHint?: string;

  /**
   * End-User's preferred languages and scripts for the User Interface.
   */
  readonly uiLocales: string[];
}
