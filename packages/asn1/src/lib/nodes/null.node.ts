import { Asn1Class } from '../asn1-class.enum';
import { Asn1Encoding } from '../asn1-encoding.enum';
import { Asn1Type } from '../asn1-type.enum';
import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Null Node denotes the ASN.1 NULL value.
 */
export class NullNode extends Node<null> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Asn1Type;

  /**
   * Instantiates a new Null Node.
   *
   * @param options Optional parameters to customize the Node.
   */
  public constructor(options?: NodeOptions);

  /**
   * Instantiates a new Null Node.
   *
   * @param data Null value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: null, options?: NodeOptions);

  /**
   * Instantiates a new Null Node.
   *
   * @param dataOrOptions Null value or optional parameters to customize the Node.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(dataOrOptions?: null | NodeOptions, options: NodeOptions = {}) {
    if (dataOrOptions !== undefined && dataOrOptions !== null) {
      options = dataOrOptions;
    }

    if (options.encoding !== undefined && options.encoding !== Asn1Encoding.Primitive) {
      throw new UnsupportedEncodingException('The Null Type only supports the Primitive Encoding.');
    }

    options.class ??= Asn1Class.Universal;
    options.encoding = Asn1Encoding.Primitive;

    super(null, options);

    this.type = Asn1Type.Null;
  }
}
