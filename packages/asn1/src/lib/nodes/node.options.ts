import { Asn1Class } from '../types/asn1-class.type';
import { Asn1Encoding } from '../types/asn1-encoding.type';

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
