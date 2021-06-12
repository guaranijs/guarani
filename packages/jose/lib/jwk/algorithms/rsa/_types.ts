import { constants } from 'crypto'

/**
 * Paddings used by the RSA Key.
 */
export enum RsaPadding {
  /**
   * Signature and Encryption Padding using PKCS#1 v1.5.
   */
  PKCS1 = constants.RSA_PKCS1_PADDING, // eslint-disable-line

  /**
   * Signature Padding using PSS with the MGF1 hash function.
   */
  PSS = constants.RSA_PKCS1_PSS_PADDING, // eslint-disable-line

  /**
   * Encryption Padding using OAEP.
   */
  OAEP = constants.RSA_PKCS1_OAEP_PADDING // eslint-disable-line
}
