import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
import { Asn1Type } from '../types/asn1-type.type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Null Node denotes the ASN.1 NULL value.
 */
export class NullNode extends Node<null> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Asn1Type = 'null';

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
    if (typeof dataOrOptions !== 'undefined' && dataOrOptions !== null) {
      options = dataOrOptions;
    }

    if (typeof options.encoding !== 'undefined' && options.encoding !== 'primitive') {
      throw new UnsupportedEncodingException('The Null Type only supports the Primitive Encoding.');
    }

    options.class ??= 'universal';
    options.encoding = 'primitive';

    super(null, options);
  }
}
