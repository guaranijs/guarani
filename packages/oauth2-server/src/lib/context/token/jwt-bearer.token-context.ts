import { User } from '../../entities/user.entity';
import { TokenContext } from './token-context';

/**
 * Parameters of the **JWT Bearer** Token Context.
 */
export interface JwtBearerTokenContext extends TokenContext {
  /**
   * User represented by the JSON Web Token Assertion.
   */
  readonly user: User;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
