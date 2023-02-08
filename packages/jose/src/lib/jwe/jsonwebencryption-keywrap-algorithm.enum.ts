/**
 * JSON Web Encryption Key Wrap Algorithms supported by Guarani.
 */
export enum JsonWebEncryptionKeyWrapAlgorithm {
  /**
   * RSAES PKCS #1 v1.5 JSON Web Encryption Key Wrap Algorithm.
   */
  RSA1_5 = 'RSA1_5',

  /**
   * RSAES OAEP using default parameters JSON Web Encryption Key Wrap Algorithm.
   */
  RSA_OAEP = 'RSA-OAEP',

  /**
   * RSAES OAEP using SHA-256 and MGF1 JSON Web Encryption Key Wrap Algorithm.
   */
  RSA_OAEP_256 = 'RSA-OAEP-256',

  /**
   * RSAES OAEP using SHA-384 and MGF1 JSON Web Encryption Key Wrap Algorithm.
   */
  RSA_OAEP_384 = 'RSA-OAEP-384',

  /**
   * RSAES OAEP using SHA-512 and MGF1 JSON Web Encryption Key Wrap Algorithm.
   */
  RSA_OAEP_512 = 'RSA-OAEP-512',

  /**
   * AES Key Wrap with default initial value using 128-bit key JSON Web Encryption Key Wrap Algorithm.
   */
  A128KW = 'A128KW',

  /**
   * AES Key Wrap with default initial value using 192-bit key JSON Web Encryption Key Wrap Algorithm.
   */
  A192KW = 'A192KW',

  /**
   * AES Key Wrap with default initial value using 256-bit key JSON Web Encryption Key Wrap Algorithm.
   */
  A256KW = 'A256KW',

  /**
   * Shared symmetric key as CEK JSON Web Encryption Key Wrap Algorithm.
   */
  Dir = 'dir',

  /**
   * Elliptic Curve Diffie-Hellman Ephemeral Static key agreement with Concat KDF JSON Web Encryption Key Wrap Algorithm.
   */
  // ECDH_ES = 'ECDH-ES',

  /**
   * ECDH-ES with Concat KDF and CEK wrapped with "A128KW" JSON Web Encryption Key Wrap Algorithm.
   */
  // ECDH_ES_A128KW = 'ECDH-ES+A128KW',

  /**
   * ECDH-ES with Concat KDF and CEK wrapped with "A192KW" JSON Web Encryption Key Wrap Algorithm.
   */
  // ECDH_ES_A192KW = 'ECDH-ES+A192KW',

  /**
   * ECDH-ES with Concat KDF and CEK wrapped with "A256KW" JSON Web Encryption Key Wrap Algorithm.
   */
  // ECDH_ES_A256KW = 'ECDH-ES+A256KW',

  /**
   * AES GCM Key wrapping using 128-bit key JSON Web Encryption Key Wrap Algorithm.
   */
  A128GCMKW = 'A128GCMKW',

  /**
   * AES GCM Key wrapping using 192-bit key JSON Web Encryption Key Wrap Algorithm.
   */
  A192GCMKW = 'A192GCMKW',

  /**
   * AES GCM Key wrapping using 256-bit key JSON Web Encryption Key Wrap Algorithm.
   */
  A256GCMKW = 'A256GCMKW',

  /**
   * PBES2 with HMAC SHA-256 and "A128KW" wrapping JSON Web Encryption Key Wrap Algorithm.
   */
  // PBES2_HS256_A128KW = 'PBES2-HS256+A128KW',

  /**
   * PBES2 with HMAC SHA-384 and "A192KW" wrapping JSON Web Encryption Key Wrap Algorithm.
   */
  // PBES2_HS384_A192KW = 'PBES2-HS384+A192KW',

  /**
   * PBES2 with HMAC SHA-512 and "A256KW" wrapping JSON Web Encryption Key Wrap Algorithm.
   */
  // PBES2_HS512_A256KW = 'PBES2-HS512+A256KW',
}
