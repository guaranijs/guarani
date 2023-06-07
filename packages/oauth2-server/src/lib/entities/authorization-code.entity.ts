import { CodeAuthorizationRequest } from '../requests/authorization/code.authorization-request';
import { Consent } from './consent.entity';
import { Login } from './login.entity';

/**
 * OAuth 2.0 Authorization Code Entity.
 */
export interface AuthorizationCode {
  /**
   * Identifier of the Authorization Code.
   */
  readonly code: string;

  /**
   * Revocation status of the Authorization Code.
   */
  isRevoked: boolean;

  /**
   * Parameters of the Authorization Request.
   */
  readonly parameters: CodeAuthorizationRequest;

  /**
   * Issuance Date of the Authorization Code.
   */
  readonly issuedAt: Date;

  /**
   * Expiration Date of the Authorization Code.
   */
  readonly expiresAt: Date;

  /**
   * Date when the Authorization Code will become valid.
   */
  readonly validAfter: Date;

  /**
   * Login with the Authentication information of the End User.
   */
  readonly login: Login;

  /**
   * Consent with the scopes granted by the End User.
   */
  readonly consent: Consent;
}
