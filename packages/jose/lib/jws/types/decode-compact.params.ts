import { JsonWebSignatureHeader } from '../jsonwebsignature.header';

/**
 * Parameters returned when decoding a JSON Web Signature Compact Token.
 */
export interface DecodeCompactParams {
  /**
   * Header of the JSON Web Signature.
   */
  readonly header: JsonWebSignatureHeader;

  /**
   * Payload of the JSON Web Signature.
   */
  readonly payload: Buffer;

  /**
   * Signature of the Header and Payload of the JSON Web Signature.
   */
  readonly signature: Buffer;
}
