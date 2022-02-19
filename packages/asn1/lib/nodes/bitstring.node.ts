import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';
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
 * The BitString Node is recognized by its padding performed on the value,
 * since it has to maintain it's length as a multiple of 8, it will pad the
 * MSBs of the value with zeros until its length reaches a multiple of 8.
 */
export class BitStringNode extends Node<Buffer> {
  /**
   * Type Identifier of the Node.
   */
  protected static readonly type: Type = Type.BitString;

  /**
   * Instantiates a new BitString Node based on the provided value.
   *
   * @param value Buffer representation of the BitString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: Buffer, options: Optional<NodeOptions> = {}) {
    if (!Buffer.isBuffer(value)) {
      throw new TypeError('Invalid parameter "value".');
    }

    if (options.method === Method.Constructed) {
      throw new Error('Unsupported Constructed Method for BitString.');
    }

    options.class ??= Class.Universal;
    options.method ??= Method.Primitive;

    super(value, options);
  }

  /**
   * Encodes the BitString Node into a Buffer object.
   *
   * @example
   * const bitstr = new BitStringNode(Buffer.from([0x02, 0x0d, 0x4f, 0x9e, 0xb3]))
   * bitstr.encode() // <Buffer 03 06 00 02 0d 4f 9e b3>
   */
  protected encodeData(): Buffer {
    const bytes = this.value[0] === 0x00 ? [...this.value] : [0x00, ...this.value];

    return Buffer.from(bytes);
  }
}
