import { Optional } from '@guarani/types';

import { Class } from '../class';
import { UnsupportedMethodException } from '../exceptions/unsupported-method.exception';
import { Encoding } from '../encoding';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The ObjectIdentifier Node denotes a sequence of integer components
 * that identifies an algorithm, a type, an authority that defines
 * other object identifiers, or any entity that provides a custom
 * implementation of an object.
 *
 * It is usually represented by a string separated by dots (e.g. 1.2.840.113549)
 * or by a list of integers (e.g. { 1 2 840 113549 }).
 */
export class ObjectIdentifierNode extends Node<number[]> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Type;

  /**
   * Parses an Integer string separated by dots into an ObjectIdentifier.
   *
   * @param data String of Integers separated by dots.
   * @param options Optional parameters to customize the Node.
   *
   * @example
   * const oid = new ObjectIdentifierNode('1.2.840.113549')
   * oid.encode() // <Buffer 06 06 2a 86 48 86 f7 0d>
   */
  public constructor(data: string, options?: Optional<NodeOptions>);

  /**
   * Parses an array of Integers into an ObjectIdentifier.
   *
   * @param data Array of Integers.
   * @param options Optional parameters to customize the Node.
   *
   * @example
   * const oid = new ObjectIdentifierNode([1, 2, 840, 113549])
   * oid.encode() // <Buffer 06 06 2a 86 48 86 f7 0d>
   */
  public constructor(data: number[], options?: Optional<NodeOptions>);

  /**
   * Parses the provided data into an ObjectIdentifier.
   *
   * @param data Data to be parsed.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string | number[], options: Optional<NodeOptions> = {}) {
    if (typeof data !== 'string' && !Array.isArray(data)) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (Array.isArray(data) && data.some((item) => !Number.isInteger(item))) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new UnsupportedMethodException('The ObjectIdentifier Type only supports the Primitive Encoding.');
    }

    const values = typeof data === 'string' ? data.split('.').map((element) => Number(element)) : data;

    if (values.some((value) => !Number.isInteger(value))) {
      throw new TypeError('The data MUST be comprised of Integers only.');
    }

    if (values.length < 2) {
      throw new TypeError('There MUST be AT LEAST two values.');
    }

    if (values.some((e) => e < 0)) {
      throw new TypeError('The OID CANNOT have negative integers.');
    }

    if (![0, 1, 2].includes(values[0])) {
      throw new TypeError('The first value MUST be between 0 and 2.');
    }

    if (values[0] < 2 && values[1] >= 40) {
      throw new TypeError('The second value is outside of range.');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Primitive;

    super(values, options);

    this.type = Type.ObjectIdentifier;
  }
}
