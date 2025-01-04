import { Dictionary } from '@guarani/types';

import { CodeAuthorizationRequest } from '../requests/authorization/code.authorization-request';
import { Consent } from './consent.entity';
import { Login } from './login.entity';

/**
 * OAuth 2.0 Authorization Code Entity.
 */
export abstract class AuthorizationCode implements Dictionary<unknown> {
  /**
   * Identifier of the Authorization Code.
   */
  public readonly id!: string;

  /**
   * Revocation status of the Authorization Code.
   */
  public isRevoked!: boolean;

  /**
   * Parameters of the Authorization Request.
   */
  public readonly parameters!: CodeAuthorizationRequest;

  /**
   * Issuance Date of the Authorization Code.
   */
  public readonly issuedAt!: Date;

  /**
   * Expiration Date of the Authorization Code.
   */
  public readonly expiresAt!: Date;

  /**
   * Date when the Authorization Code will become valid.
   */
  public readonly validAfter!: Date;

  /**
   * Login with the Authentication information of the End User.
   */
  public readonly login!: Login;

  /**
   * Consent with the scopes granted by the End User.
   */
  public readonly consent!: Consent;

  /**
   * Additional Authorization Code Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Authorization Code.
   */
  public get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }
}
