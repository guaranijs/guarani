import { JsonWebEncryptionHeaderParameters } from '../../jsonwebencryption.header.parameters';

/**
 * JSON Web Encryption AES-GCM Key Wrap Header Parameters.
 */
export interface GcmHeaderParameters extends JsonWebEncryptionHeaderParameters {
  /**
   * Base64Url encoded 96-bits Initialization Vector.
   */
  readonly iv: string;

  /**
   * Base64Url encoded 128-bits Authentication Tag.
   */
  readonly tag: string;
}
