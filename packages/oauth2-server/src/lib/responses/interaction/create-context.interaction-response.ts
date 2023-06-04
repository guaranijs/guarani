import { Dictionary } from '@guarani/types';

import { CreateContext } from './create.context';

/**
 * Parameters of the custom OAuth 2.0 Create Context Interaction Response.
 */
export interface CreateContextInteractionResponse extends Dictionary<any> {
  /**
   * Indicates if the application can skip displaying the user registration screen.
   */
  readonly skip: boolean;

  /**
   * Request Url.
   */
  readonly request_url: string;

  /**
   * Context for the Create Interaction.
   */
  readonly context: CreateContext;
}
