import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { CodeAuthorizationRequest } from '../messages/code.authorization-request';

/**
 * Interface of the Authorization Code Service.
 *
 * The Authorization Code Service contains the operations regarding the OAuth 2.0 Authorization Code.
 */
export interface AuthorizationCodeServiceInterface {
  /**
   * Creates an Authorization Code to be exchanged by the Client at the Token Endpoint for an Access Token.
   *
   * @param parameters Parameters of the **Code** Response Type.
   * @param client Client requesting authorization.
   * @param user End User that granted authorization.
   * @returns Issued Authorization Code.
   */
  create(parameters: CodeAuthorizationRequest, client: Client, user: User): Promise<AuthorizationCode>;

  /**
   * Searches the application's storage for an Authorization Code containing the provided Code.
   *
   * @param code Code of the Authorization Code.
   * @returns Authorization Code based on the provided Code.
   */
  findOne(code: string): Promise<AuthorizationCode | null>;

  /**
   * Revokes the provided Authorization Code.
   *
   * @param authorizationCode Authorization Code to be revoked.
   */
  revoke(authorizationCode: AuthorizationCode): Promise<void>;
}
