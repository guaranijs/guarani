import { JoseHeaderParameters } from '../jose/jose.header.parameters';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature-algorithm.type';

/**
 * Parameters of the JSON Web Signature Header.
 */
export interface JsonWebSignatureHeaderParameters extends JoseHeaderParameters {
  /**
   * JSON Web Signature Algorithm used to Sign and Verify the Token.
   */
  readonly alg: JsonWebSignatureAlgorithm;
}
