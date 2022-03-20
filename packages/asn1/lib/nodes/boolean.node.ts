import { Optional } from '@guarani/types';

import { Class } from '../class';
import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
import { Encoding } from '../encoding';
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
  public readonly type: Type;

  /**
   * Instantiates a new Boolean Node.
   *
   * @param data Boolean value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: boolean, options: Optional<NodeOptions> = {}) {
    if (typeof data !== 'boolean') {
      throw new TypeError('Invalid parameter "data".');
    }

    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new UnsupportedEncodingException('The Boolean Type only supports the Primitive Encoding.');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Primitive;

    super(data, options);

    this.type = Type.Boolean;
  }
}