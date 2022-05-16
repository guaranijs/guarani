import { Dict, Optional } from '@guarani/types';

import { Client } from './client';
import { User } from './user';

export interface AbstractToken extends Dict {
  /**
   * Scopes granted to the Client.
   */
  scopes: string[];

  /**
   * Revocation status of the Token.
   */
  isRevoked: boolean;

  /**
   * Issuance Date of the Token.
   */
  issuedAt: Date;

  /**
   * Expiration Date of the Token.
   */
  expiresAt: Date;

  /**
   * Date when the Token will become valid.
   */
  validAfter: Date;

  /**
   * Client that requested the Token.
   */
  client: Client;

  /**
   * End User that granted authorization to the Client.
   */
  user?: Optional<User>;
}
