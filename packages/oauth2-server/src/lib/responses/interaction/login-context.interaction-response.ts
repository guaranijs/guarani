import { Dictionary } from '@guarani/types';

import { LoginContext } from './login.context';

/**
 * Parameters of the custom OAuth 2.0 Login Context Interaction Response.
 */
export interface LoginContextInteractionResponse extends Dictionary<unknown> {
  /**
   * Indicates if the application can skip displaying the login screen.
   */
  readonly skip: boolean;

  /**
   * Request Url.
   */
  readonly request_url: string;

  /**
   * Identifier of the Client requesting authorization.
   */
  readonly client: string;

  /**
   * Context for the Login Interaction.
   */
  readonly context: LoginContext;
}
