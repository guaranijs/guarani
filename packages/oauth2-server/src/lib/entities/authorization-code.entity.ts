import { Consent } from './consent.entity';

/**
 * OAuth 2.0 Authorization Code Entity.
 */
export interface AuthorizationCode extends Record<string, any> {
  /**
   * Identifier of the Authorization Code.
   */
  readonly code: string;

  /**
   * Revocation status of the Authorization Code.
   */
  isRevoked: boolean;

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
   * Consent granted by the Authenticated User.
   */
  readonly consent: Consent;
}
