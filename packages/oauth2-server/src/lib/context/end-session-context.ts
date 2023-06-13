import { URL, URLSearchParams } from 'url';

import { Dictionary, Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';

/**
 * Parameters of the End Session Context.
 */
export interface EndSessionContext {
  /**
   * Parameters of the End Session Request.
   */
  readonly parameters: URLSearchParams;

  /**
   * Cookies of the Http Request.
   */
  readonly cookies: Dictionary<unknown>;

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
  readonly postLogoutRedirectUri: Nullable<URL>;

  /**
   * State of the Client prior to the End Session Request.
   */
  readonly state: Nullable<string>;

  /**
   * Hint to the Authorization Server about the User being logged out.
   */
  readonly logoutHint: Nullable<string>;

  /**
   * End-User's preferred languages and scripts for the User Interface.
   */
  readonly uiLocales: string[];
}
