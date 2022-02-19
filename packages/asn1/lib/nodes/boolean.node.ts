import { integerToBuffer } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Boolean Node denotes a boolean (you don't say).
 */
export class BooleanNode extends Node<boolean> {
  /**
   * Type Identifier of the Node.
   */
  protected static readonly type: Type = Type.Boolean;

  /**
   * Instantiates a new Boolean Node.
   *
   * @param value Boolean value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: boolean, options: Optional<NodeOptions> = {}) {
    if (typeof value !== 'boolean') {
      throw new TypeError('Invalid parameter "value".');
    }

    if (typeof options.method !== 'undefined' && options.method !== Method.Primitive) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Primitive;

    super(value, options);
  }

  /**
   * Encodes the Boolean Node into a Buffer object.
   *
   * @example
   * const trueValue = new BooleanNode(true)
   * trueValue.encode() // <Buffer 01 01 01>
   *
   * const falseValue = new BooleanNode(false)
   * falseValue.encode() // <Buffer 01 01 00>
   */
  protected encodeData(): Buffer {
    return integerToBuffer(this.value ? 0x01n : 0x00n);
  }
}
