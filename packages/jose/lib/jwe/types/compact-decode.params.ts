import { JsonWebEncryptionHeader } from '../jsonwebencryption.header';

/**
 * Parameters that compose the Decoded JSON Web Encryption Token.
 */
export interface CompactDecodeParams {
  /**
   * JSON Web Encryption Header.
   */
  readonly header: JsonWebEncryptionHeader;

  /**
   * Wrapped Content Encryption Key.
   */
  readonly ek: Buffer;

  /**
   * Initialization Vector.
   */
  readonly iv: Buffer;

  /**
   * Ciphertext.
   */
  readonly ciphertext: Buffer;

  /**
   * Authentication Tag.
   */
  readonly tag: Buffer;

  /**
   * Additional Authenticated Data.
   */
  readonly aad: Buffer;
}
