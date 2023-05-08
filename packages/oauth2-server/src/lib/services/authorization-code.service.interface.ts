import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { CodeAuthorizationRequest } from '../requests/authorization/code.authorization-request';

/**
 * Interface of the Authorization Code Service.
 *
 * The Authorization Code Service contains the operations regarding the OAuth 2.0 Authorization Code.
 */
export interface AuthorizationCodeServiceInterface {
  /**
   * Creates an Authorization Code to be exchanged by the Client at the Token Endpoint for an Access Token.
   *
   * @param parameters Parameters of the Code Authorization Request.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Issued Authorization Code.
   */
  create(parameters: CodeAuthorizationRequest, login: Login, consent: Consent): Promise<AuthorizationCode>;

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
