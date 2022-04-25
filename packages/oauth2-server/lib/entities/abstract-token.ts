import { OneOrMany } from '@guarani/types';

import { ClientEntity } from './client.entity';

export interface AbstractToken {
  /**
   * String representation of the Token.
   */
  readonly token: string;

  /**
   * Scopes granted to the Token.
   */
  readonly scopes: string[];

  /**
   * Informs whether or not the Token is revoked.
   */
  isRevoked: boolean;

  /**
   * Issuance Date of the Token.
   */
  readonly issuedAt: Date;

  /**
   * Expiration Date of the Token.
   */
  readonly expiresAt: Date;

  /**
   * Date when the Token will become valid.
   */
  readonly validAfter: Date;

  /**
   * Audience of the Token.
   */
  readonly audience: OneOrMany<string>;

  /**
   * Client that requested the Token.
   */
  readonly client: ClientEntity;
}
