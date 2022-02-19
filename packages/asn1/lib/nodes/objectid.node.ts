import { integerToBuffer } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The ObjectId Node denotes a sequence of integer components that identifies
 * an algorithm, a type, an authority that defines other object identifiers,
 * or any entity that provides a custom implementation of an object.
 *
 * It is usually represented by a string separated by dots (e.g. 1.2.840.113549)
 * or by a list of integers (e.g. { 1 2 840 113549 }).
 */
export class ObjectIdNode extends Node<number[]> {
  /**
   * Type Identifier of the Node.
   */
  protected static readonly type: Type = Type.ObjectId;

  /**
   * Parses an Integer string separated by dots into an ObjectId.
   *
   * @param value String of Integers separated by dots.
   *
   * @example
   * const oid = new ObjectIdNode('1.2.840.113549')
   * oid.encode() // <Buffer 06 06 2a 86 48 86 f7 0d>
   */
  public constructor(value: string, options?: Optional<NodeOptions>);

  /**
   * Parses an array of Integers into an ObjectId.
   *
   * @param value Array of Integers.
   *
   * @example
   * const oid = new ObjectIdNode([1, 2, 840, 113549])
   * oid.encode() // <Buffer 06 06 2a 86 48 86 f7 0d>
   */
  public constructor(value: number[], options?: Optional<NodeOptions>);

  /**
   * Parses the provided data into an ObjectId.
   *
   * @param value Data to be parsed.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: string | number[], options: Optional<NodeOptions> = {}) {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (Array.isArray(value) && value.some((e) => !Number.isInteger(e))) {
      throw new TypeError('Invalid parameter "data".');
    }

    const values = typeof value === 'string' ? value.split('.').map((e) => Number(e)) : value;

    if (values.some((value) => !Number.isInteger(value))) {
      throw new TypeError('The data MUST be comprised of Integers only.');
    }

    if (values.length < 2) {
      throw new Error('There MUST be AT LEAST two values.');
    }

    if (values.some((e) => e < 0)) {
      throw new Error('The OID CANNOT have negative integers.');
    }

    if (![0, 1, 2].includes(values[0])) {
      throw new Error('The first value MUST be between 0 and 2.');
    }

    if (values[0] < 2 && values[1] >= 40) {
      throw new Error('The second value is outside of range.');
    }

    if (typeof options.method !== 'undefined' && options.method !== Method.Primitive) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Primitive;

    super(values, options);
  }

  /**
   * Encodes the ObjectId Node into a Buffer object.
   *
   * @example
   * const oid = new ObjectIdNode('1.2.840.113549.1.1.1')
   * oid.encode() // <Buffer 06 09 2a 86 48 86 f7 0d 01 01 01>
   */
  protected encodeData(): Buffer {
    const bytes: Buffer[] = [];
    const firstByte = integerToBuffer(40 * this.value[0] + this.value[1]);

    for (let i = this.value.length - 1; i > 1; i--) {
      let element = this.value[i];

      bytes.push(integerToBuffer(BigInt(element & 0x7f)));

      while ((element >>>= 7) > 0) {
        bytes.push(integerToBuffer(BigInt(0x80 | (element & 0x7f))));
      }
    }

    return Buffer.concat([firstByte, ...bytes.reverse()]);
  }
}
