import { Asn1Class } from '../asn1-class.enum';
import { Asn1Encoding } from '../asn1-encoding.enum';

/**
 * Optional attributes of the Node.
 */
export interface NodeOptions {
  /**
   * Encoding of the Node.
   */
  encoding?: Asn1Encoding;

  /**
   * Class of the Node.
   */
  class?: Asn1Class;

  /**
   * Explicit Tag Identifier of the Node.
   */
  explicit?: number;

  /**
   * Implicit Tag Identifier of the Node.
   */
  implicit?: number;
}
