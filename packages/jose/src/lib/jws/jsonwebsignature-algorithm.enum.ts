/**
 * JSON Web Signature Algorithms supported by Guarani.
 */
export enum JsonWebSignatureAlgorithm {
  /**
   * ECDSA using P-256 and SHA-256 JSON Web Signature Algorithm.
   */
  ES256 = 'ES256',

  /**
   * ECDSA using P-384 and SHA-384 JSON Web Signature Algorithm.
   */
  ES384 = 'ES384',

  /**
   * ECDSA using P-521 and SHA-512 JSON Web Signature Algorithm.
   */
  ES512 = 'ES512',

  /**
   * HMAC using SHA-256 JSON Web Signature Algorithm.
   */
  HS256 = 'HS256',

  /**
   * HMAC using SHA-384 JSON Web Signature Algorithm.
   */
  HS384 = 'HS384',

  /**
   * HMAC using SHA-512 JSON Web Signature Algorithm.
   */
  HS512 = 'HS512',

  /**
   * No Digital Signature or MAC JSON Web Signature Algorithm.
   */
  None = 'none',

  /**
   * RSASSA-PSS using SHA-256 and MGF1 with SHA-256 JSON Web Signature Algorithm.
   */
  PS256 = 'PS256',

  /**
   * RSASSA-PSS using SHA-384 and MGF1 with SHA-384 JSON Web Signature Algorithm.
   */
  PS384 = 'PS384',

  /**
   * RSASSA-PSS using SHA-512 and MGF1 with SHA-512 JSON Web Signature Algorithm.
   */
  PS512 = 'PS512',

  /**
   * RSASSA-PKCS1-v1_5 using SHA-256 JSON Web Signature Algorithm.
   */
  RS256 = 'RS256',

  /**
   * RSASSA-PKCS1-v1_5 using SHA-384 JSON Web Signature Algorithm.
   */
  RS384 = 'RS384',

  /**
   * RSASSA-PKCS1-v1_5 using SHA-512 JSON Web Signature Algorithm.
   */
  RS512 = 'RS512',
}
