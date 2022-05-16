import { Optional } from '@guarani/types';

import { AuthorizationCode } from '../entities/authorization-code';
import { Client } from '../entities/client';
import { User } from '../entities/user';
import { CodeAuthorizationParameters } from '../models/code.authorization-parameters';

/**
 * Representation of the Authorization Code Service.
 *
 * The Authorization Code Service contains the operations performed by Guarani
 * regarding the OAuth 2.0 Authorization Code.
 */
export interface IAuthorizationCodeService {
  /**
   * Creates an Authorization Code Grant to be exchanged by the Client at the Token Endpoint for an Access Token.
   *
   * @param parameters Parameters of the **Code** Response Type.
   * @param client Client requesting authorization.
   * @param user End User that granted authorization.
   * @returns Issued Authorization Code.
   */
  createAuthorizationCode(
    parameters: CodeAuthorizationParameters,
    client: Client,
    user: User
  ): Promise<AuthorizationCode>;

  /**
   * Searches the application's storage for an Authorization Code containing the provided Code.
   *
   * @param code Code of the Authorization Code.
   * @returns Authorization Code based on the provided Code.
   */
  findAuthorizationCode(code: string): Promise<Optional<AuthorizationCode>>;

  /**
   * Revokes the provided Authorization Code.
   *
   * @param authorizationCode Authorization Code to be revoked.
   */
  revokeAuthorizationCode(authorizationCode: AuthorizationCode): Promise<void>;
}
