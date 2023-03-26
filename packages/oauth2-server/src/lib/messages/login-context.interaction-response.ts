import { Client } from '../entities/client.entity';
import { LoginContext } from './login.context';

/**
 * Parameters of the custom OAuth 2.0 Login Context Interaction Response.
 */
export interface LoginContextInteractionResponse {
  /**
   * Indicates if the application can skip displaying the login screen.
   */
  readonly skip: boolean;

  /**
   * Request Url.
   */
  readonly request_url: string;

  /**
   * Client requesting authorization.
   */
  readonly client: Client;

  /**
   * Context for the Login Interaction.
   */
  readonly context: LoginContext;
}
