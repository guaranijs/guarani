import { Optional } from '@guarani/types';

import { Class } from '../class';
import { UnsupportedMethodException } from '../exceptions/unsupported-method.exception';
import { Encoding } from '../encoding';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Integer Node denotes the representation of a signed integer.
 *
 * Some applications might require the integer to be unsigned,
 * or for it to be `{ x ∣ x ∈ N* }`. The conversion to and from the
 * required signaling of the integer is left to the application.
 */
export class IntegerNode extends Node<bigint> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Type;

  /**
   * Instantiates a new Integer Node.
   *
   * @param data Integer value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: number | bigint, options: Optional<NodeOptions> = {}) {
    if (typeof data !== 'number' && typeof data !== 'bigint') {
      throw new TypeError('Invalid parameter "data".');
    }

    if (typeof data === 'number' && !Number.isInteger(data)) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new UnsupportedMethodException('The Integer Type only supports the Primitive Encoding Encoding.');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Primitive;

    super(BigInt(data), options);

    this.type = Type.Integer;
  }
}
