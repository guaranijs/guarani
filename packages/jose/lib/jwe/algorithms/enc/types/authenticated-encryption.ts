/**
 * Parameters that represent the Encryption result.
 */
export interface AuthenticatedEncryption {
  /**
   * Ciphertext.
   */
  readonly ciphertext: Buffer;

  /**
   * Authentication Tag.
   */
  readonly tag: Buffer;
}
