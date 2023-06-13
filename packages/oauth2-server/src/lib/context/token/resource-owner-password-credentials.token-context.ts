import { User } from '../../entities/user.entity';
import { TokenContext } from './token-context';

/**
 * Parameters of the **Resource Owner Password Credentials** Token Context.
 */
export interface ResourceOwnerPasswordCredentialsTokenContext extends TokenContext {
  /**
   * User represented by the Resource Owner Credentials provided by the Client.
   */
  readonly user: User;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
