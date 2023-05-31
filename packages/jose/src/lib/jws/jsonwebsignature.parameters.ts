import { Buffer } from 'buffer';

import { JsonWebSignatureHeader } from './jsonwebsignature.header';

/**
 * Parameters representing the components of a JSON Web Signature.
 */
export interface JsonWebSignatureParameters {
  /**
   * JSON Web Encryption Header.
   */
  readonly header: JsonWebSignatureHeader;

  /**
   * Payload of the Token.
   */
  readonly payload: Buffer;

  /**
   * Signature of the Token.
   */
  readonly signature: Buffer;
}
