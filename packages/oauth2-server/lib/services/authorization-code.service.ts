import { Nullable } from '@guarani/types';

import { AuthorizationCode } from '../entities/authorization-code';
import { Client } from '../entities/client';
import { User } from '../entities/user';
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
    client: Client,
    user: User
  ): Promise<AuthorizationCode>;

  /**
   * Searches the application's storage for an Authorization Code containing the provided Code.
   *
   * @param code Code of the Authorization Code.
   * @returns Authorization Code based on the provided Code.
   */
  findAuthorizationCode(code: string): Promise<Nullable<AuthorizationCode>>;

  /**
   * Revokes the provided Authorization Code.
   *
   * @param authorizationCode Authorization Code to be revoked.
   */
  revokeAuthorizationCode(authorizationCode: AuthorizationCode): Promise<void>;
}
