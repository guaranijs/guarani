import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * Representation of the NULL value.
 */
export class NullNode extends Node<null> {
  /**
   * Type Identifier of the Node.
   */
  protected static readonly type: Type = Type.Null;

  /**
   * Instantiates a new Null Node.
   *
   * @param value Null object.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: null, options: Optional<NodeOptions> = {}) {
    if (value !== null) {
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
   * Encodes the Null Node into a Buffer object.
   *
   * @example
   * const nullValue = new NullNode()
   * nullValue.encode() // <Buffer 05 00>
   */
  protected encodeData(): Buffer {
    return Buffer.alloc(0);
  }
}
