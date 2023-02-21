import { Consent } from './consent.entity';
import { Session } from './session.entity';

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
   * Authentication Date of the End User.
   */
  readonly authTime: Date;

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
   * Session with the Authentication information of the End User.
   */
  readonly session: Session;

  /**
   * Consent with the scopes granted by the End User.
   */
  readonly consent: Consent;
}
