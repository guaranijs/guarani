import { Dictionary } from '@guarani/types';

import { LogoutContext } from './logout.context';

/**
 * Parameters of the custom OAuth 2.0 Logout Context Interaction Response.
 */
export interface LogoutContextInteractionResponse extends Dictionary<unknown> {
  /**
   * Indicates if the application can skip displaying the logout screen.
   */
  readonly skip: boolean;

  /**
   * Request Url.
   */
  readonly request_url: string;

  /**
   * Identifier of the Client requesting logout.
   */
  readonly client: string;

  /**
   * Context for the Logout Interaction.
   */
  readonly context: LogoutContext;
}
