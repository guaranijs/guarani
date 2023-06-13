import { TokenContext } from './token-context';

/**
 * Parameters of the **Client Credentials** Token Context.
 */
export interface ClientCredentialsTokenContext extends TokenContext {
  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
