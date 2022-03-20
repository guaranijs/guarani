/**
 * Interface of the additional header parameters of the AES-GCM-KW Algorithm.
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
