import { integerToBuffer } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';
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
  protected static readonly type: Type = Type.Integer;

  /**
   * Instantiates a new Integer Node.
   *
   * @param value Integer value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: number, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new Integer Node.
   *
   * @param value Integer value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: bigint, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new Integer Node.
   *
   * @param value Integer value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: number | bigint, options: Optional<NodeOptions> = {}) {
    if (typeof value !== 'bigint' && typeof value !== 'number') {
      throw new TypeError('Invalid parameter "value".');
    }

    if (typeof value === 'number' && !Number.isInteger(value)) {
      throw new TypeError('Invalid parameter "value".');
    }

    if (typeof options.method !== 'undefined' && options.method !== Method.Primitive) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Primitive;

    super(BigInt(value), options);
  }

  /**
   * Encodes the Integer Node into a Buffer object.
   *
   * @example
   * const integer = new IntegerNode(65537)
   * integer.encode() // <Buffer 02 03 01 00 01>
   */
  protected encodeData(): Buffer {
    return integerToBuffer(this.value, true);
  }
}
