import { Asn1Class } from '../asn1-class.enum';
import { Asn1Encoding } from '../asn1-encoding.enum';
import { Asn1Type } from '../asn1-type.enum';
import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Boolean Node denotes a boolean (you don't say).
 */
export class BooleanNode extends Node<boolean> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Asn1Type;

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

    if (options.encoding !== undefined && options.encoding !== Asn1Encoding.Primitive) {
      throw new UnsupportedEncodingException('The Boolean Type only supports the Primitive Encoding.');
    }

    options.class ??= Asn1Class.Universal;
    options.encoding = Asn1Encoding.Primitive;

    super(data, options);

    this.type = Asn1Type.Boolean;
  }
}
