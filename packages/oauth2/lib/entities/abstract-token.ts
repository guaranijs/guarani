import { OneOrMany } from '@guarani/utils'

import { Client } from './client'
import { User } from './user'

/**
 * Defines the base model for the OAuth 2.0 Tokens of Guarani.
 */
export interface AbstractToken {
  /**
   * Returns the Identifier of the Token.
   */
  getIdentifier(): string

  /**
   * Returns the Scopes of the Token.
   */
  getScopes(): string[]

  /**
   * Returns the Date of Creation of the Token.
   */
  getIssuedAt(): Date

  /**
   * Returns the Expiration Date of the Token.
   */
  getExpiresAt(): Date

  /**
   * Returns the Date after which the Token becomes valid.
   */
  getValidAfter(): Date

  /**
   * Returns the Audience to which the Token is intended.
   */
  getAudience(): OneOrMany<string>

  /**
   * Returns the Authorized Client of the Token.
   */
  getClient(): Client

  /**
   * Returns the User that authorized the Token.
   */
  getUser(): User

  /**
   * Checks if the Token is revoked.
   */
  isRevoked(): boolean
}
