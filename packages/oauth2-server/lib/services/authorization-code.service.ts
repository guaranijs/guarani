import { AuthorizationCodeEntity } from '../entities/authorization-code.entity';
import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';
import { AuthorizationCodeParameters } from '../response-types/types/authorization-code.parameters';

/**
 * Representation of the Authorization Code Service.
 *
 * The Authorization Code Service contains the operations performed by Guarani
 * that are concerned with the OAuth 2.0 Authorization Code.
 */
export interface AuthorizationCodeService {
  /**
   * Creates an instance of an Authorization Code.
   *
   * @param params Authorization Code Parameters.
   * @param scopes Scopes granted to the Client.
   * @param client Client of the Request.
   * @param user User that granted authorization to the Client.
   * @returns Instance of an Authorization Code.
   */
  createAuthorizationCode(
    params: AuthorizationCodeParameters,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<AuthorizationCodeEntity>;
}
