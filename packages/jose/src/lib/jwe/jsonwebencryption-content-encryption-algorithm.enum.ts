/**
 * JSON Web Encryption Content Encryption Algorithms supported by Guarani.
 */
export enum JsonWebEncryptionContentEncryptionAlgorithm {
  /**
   * AES Block Cipher Mode 128-bits using HMAC with SHA-256 JSON Web Encryption Content Encryption Algorithm.
   */
  A128CBC_HS256 = 'A128CBC-HS256',

  /**
   * AES Block Cipher Mode 192-bits using HMAC with SHA-384 JSON Web Encryption Content Encryption Algorithm.
   */
  A192CBC_HS384 = 'A192CBC-HS384',

  /**
   * AES Block Cipher Mode 256-bits using HMAC with SHA-512 JSON Web Encryption Content Encryption Algorithm.
   */
  A256CBC_HS512 = 'A256CBC-HS512',

  /**
   * AES Galois Counter Mode using 128-bits key JSON Web Encryption Content Encryption Algorithm.
   */
  A128GCM = 'A128GCM',

  /**
   * AES Galois Counter Mode using 192-bits key JSON Web Encryption Content Encryption Algorithm.
   */
  A192GCM = 'A192GCM',

  /**
   * AES Galois Counter Mode using 256-bits key JSON Web Encryption Content Encryption Algorithm.
   */
  A256GCM = 'A256GCM',
}
