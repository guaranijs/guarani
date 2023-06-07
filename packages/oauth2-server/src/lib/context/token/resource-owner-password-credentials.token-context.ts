import { User } from '../../entities/user.entity';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../../requests/token/resource-owner-password-credentials.token-request';
import { TokenContext } from './token-context';

/**
 * Parameters of the **Resource Owner Password Credentials** Token Context.
 */
export interface ResourceOwnerPasswordCredentialsTokenContext
  extends TokenContext<ResourceOwnerPasswordCredentialsTokenRequest> {
  /**
   * User represented by the Resource Owner Credentials provided by the Client.
   */
  readonly user: User;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
