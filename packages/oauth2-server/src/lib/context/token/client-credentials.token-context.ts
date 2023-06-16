import { ClientCredentialsTokenRequest } from '../../requests/token/client-credentials.token-request';
import { TokenContext } from './token-context';

/**
 * Parameters of the **Client Credentials** Token Context.
 */
export interface ClientCredentialsTokenContext extends TokenContext<ClientCredentialsTokenRequest> {
  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
