import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
import { Asn1Type } from '../types/asn1-type.type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Boolean Node denotes a boolean (you don't say).
 */
export class BooleanNode extends Node<boolean> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Asn1Type = 'boolean';

  /**
   * Instantiates a new Boolean Node.
   *
   * @param data Boolean value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: boolean, options: NodeOptions = {}) {
    if (typeof data !== 'boolean') {
      throw new TypeError('Invalid parameter "data".');
    }

    if (typeof options.encoding !== 'undefined' && options.encoding !== 'primitive') {
      throw new UnsupportedEncodingException('The Boolean Type only supports the Primitive Encoding.');
    }

    options.class ??= 'universal';
    options.encoding = 'primitive';

    super(data, options);
  }
}
