import { bufferToBinary } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Encoding } from '../encoding';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The BitString Node denotes an arbitrary string of bits (ones and zeroes).
 *
 * It is used for digital signatures on extended certificates in PKCS #6's
 * ExtendedCertificate type, for digital signatures on certificates in X.509's
 * Certificate type, and for public keys in certificates in X.509's
 * SubjectPublicKeyInfo type.
 *
 * The X.509's SubjectPublicKeyInfo type can be defined as:
 *
 * ```rst
 * SubjectPublicKeyInfo ::= SEQUENCE {
 *   algorithm AlgorithmIdentifier,
 *   publicKey BIT STRING
 * }
 * ```
 *
 * The BitString Node is recognized by its padding performed on the data,
 * since it has to maintain it's length as a multiple of 8, it will pad the
 * LSBs of the data with zeros until its length reaches a multiple of 8.
 */
export class BitStringNode extends Node<string | BitStringNode[]> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Type;

  /**
   * Padding string of the BitString.
   */
  public padding: string;

  /**
   * Instantiates a new BitString Node based on the provided String.
   *
   * @param data String representation of the BitString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new BitString Node based on the provided String.
   *
   * @param data String representation of the BitString.
   * @param padding Padding string of the BitString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string, padding: string, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new BitString Node based on the provided Buffer.
   *
   * @param data Buffer representation of the BitString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: Buffer, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new BitString Node based on the provided BitString Nodes.
   *
   * @param data Substrings of the BitString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: BitStringNode[], options?: Optional<NodeOptions>);

  /**
   * Instantiates a new BitString Node based on the provided data.
   *
   * @param data Data representing the BitString.
   * @param paddingOrOptions Padding string of the BitString or optional parameters to customize the Node.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(
    data: string | Buffer | BitStringNode[],
    paddingOrOptions?: Optional<string | number | NodeOptions>,
    options: Optional<NodeOptions> = {}
  ) {
    if (typeof data !== 'string' && !Buffer.isBuffer(data) && !Array.isArray(data)) {
      throw new TypeError('Invalid parameter "data".');
    }

    let paddingBits: string = '';

    // String Branch.
    if (typeof data === 'string') {
      const bitsRegex = /^[0-1]*$/;

      if (!bitsRegex.test(data)) {
        throw new TypeError('Invalid parameter "data".');
      }

      options = typeof paddingOrOptions === 'object' ? paddingOrOptions : options;

      if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
        throw new TypeError('This configuration expects a Primitive Encoding.');
      }

      const padding: Optional<string> = typeof paddingOrOptions === 'string' ? paddingOrOptions : undefined;

      const modulo = data.length % 8;
      const unusedBits = modulo === 0 ? 0 : 8 - modulo;

      if (padding !== undefined && (!bitsRegex.test(padding) || padding.length !== unusedBits)) {
        throw new TypeError('Invalid parameter "padding".');
      }

      options.encoding = Encoding.Primitive;

      paddingBits = padding ?? '0'.repeat(unusedBits);
    }

    // Buffer Branch.
    else if (Buffer.isBuffer(data)) {
      const unusedBits = data[0];

      if (unusedBits > 0x07) {
        throw new TypeError('Invalid unused bits value.');
      }

      options = <NodeOptions>paddingOrOptions ?? options;

      if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
        throw new TypeError('This configuration expects a Primitive Encoding.');
      }

      options.encoding = Encoding.Primitive;

      const bits = bufferToBinary(data.subarray(1));

      data = bits.substring(0, bits.length - unusedBits);

      paddingBits = bits.substring(bits.length - unusedBits);
    }

    // Constructed Branch.
    else {
      if (data.some((node) => !(node instanceof BitStringNode) || node.class !== Class.Universal)) {
        throw new TypeError('One or more substrings are not Universal BitStrings.');
      }

      if (data.slice(0, -1).some((node) => !Array.isArray(node.data) && node.padding !== '')) {
        throw new TypeError('One or more non-last substrings have a length not multiple of eight.');
      }

      options = <NodeOptions>(paddingOrOptions ?? options);

      if (options.encoding !== undefined && options.encoding !== Encoding.Constructed) {
        throw new TypeError('This configuration expects a Constructed Encoding.');
      }

      options.encoding = Encoding.Constructed;
    }

    options.class ??= Class.Universal;

    super(data, options);

    this.type = Type.BitString;
    this.padding = paddingBits;
  }
}
