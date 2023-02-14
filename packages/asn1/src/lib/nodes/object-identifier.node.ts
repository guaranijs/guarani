import { Asn1Class } from '../asn1-class.enum';
import { Asn1Encoding } from '../asn1-encoding.enum';
import { Asn1Type } from '../asn1-type.enum';
import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
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
export class ObjectIdentifierNode extends Node<string> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Asn1Type;

  /**
   * Parses an Integer string separated by dots into an ObjectIdentifier.
   *
   * @param data String of Integers separated by dots.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string, options?: NodeOptions);

  /**
   * Parses an array of Integers into an ObjectIdentifier.
   *
   * @param data Array of Integers.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: number[], options?: NodeOptions);

  /**
   * Parses the provided data into an ObjectIdentifier.
   *
   * @param data Data to be parsed.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string | number[], options: NodeOptions = {}) {
    if (typeof data !== 'string' && !Array.isArray(data)) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (Array.isArray(data) && data.some((item) => !Number.isInteger(item))) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (options.encoding !== undefined && options.encoding !== Asn1Encoding.Primitive) {
      throw new UnsupportedEncodingException('The ObjectIdentifier Type only supports the Primitive Encoding.');
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

    if (![0, 1, 2].includes(values[0]!)) {
      throw new TypeError('The first value MUST be between 0 and 2.');
    }

    if (values[0]! < 2 && values[1]! >= 40) {
      throw new TypeError('The second value is outside of range.');
    }

    options.class ??= Asn1Class.Universal;
    options.encoding = Asn1Encoding.Primitive;

    super(values.join('.'), options);

    this.type = Asn1Type.ObjectIdentifier;
  }
}
