import { User } from '../../entities/user.entity';
import { JwtBearerTokenRequest } from '../../requests/token/jwt-bearer.token-request';
import { TokenContext } from './token-context';

/**
 * Parameters of the **JWT Bearer** Token Context.
 */
export interface JwtBearerTokenContext extends TokenContext<JwtBearerTokenRequest> {
  /**
   * User represented by the JSON Web Token Assertion.
   */
  readonly user: User;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
