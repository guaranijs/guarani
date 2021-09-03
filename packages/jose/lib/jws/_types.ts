import { JWSHeaderParams } from './jsonwebsignature.header'

/**
 * Interface of the JWS JSON Signature format.
 */
export interface JWSJSONSignature {
  /**
   * Signature of the JSON Web Signature JSON Token.
   */
  readonly signature: string

  /**
   * JWS Protected Header of the JSON Web Signature Token.
   */
  readonly protected?: string

  /**
   * JWS Unprotected Header of the JSON Web Signature Token.
   */
  readonly header?: Partial<JWSHeaderParams>
}

/**
 * Interface of the JWS Flattened Serialization.
 */
export interface JWSFlattenedSerialization extends JWSJSONSignature {
  /**
   * Payload of the JSON Web Signature Token.
   */
  readonly payload: string
}

/**
 * Interface of the JWS JSON Serialization.
 */
export interface JWSJSONSerialization {
  /**
   * Payload of the JSON Web Signature Token.
   */
  readonly payload: string

  /**
   * List of JWS JSON Signatures.
   */
  readonly signatures: JWSJSONSignature[]
}
