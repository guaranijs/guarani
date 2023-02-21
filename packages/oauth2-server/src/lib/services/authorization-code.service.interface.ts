import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';

/**
 * Interface of the Authorization Code Service.
 *
 * The Authorization Code Service contains the operations regarding the OAuth 2.0 Authorization Code.
 */
export interface AuthorizationCodeServiceInterface {
  /**
   * Creates an Authorization Code to be exchanged by the Client at the Token Endpoint for an Access Token.
   *
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Issued Authorization Code.
   */
  create(session: Session, consent: Consent): Promise<AuthorizationCode>;

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
