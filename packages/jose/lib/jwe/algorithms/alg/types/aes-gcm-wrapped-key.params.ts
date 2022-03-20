/**
 * Additional JSON Web Encryption Header Parameters for the AES-GCM JSON Web Encryption Key Wrap Algorithm.
 */
export interface AesGcmWrappedKeyParams {
  /**
   * Initialization Vector.
   */
  readonly iv: string;

  /**
   * Authentication Tag.
   */
  readonly tag: string;
}
