import { Optional } from '@guarani/types';

import { Class } from '../class';
import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
import { Encoding } from '../encoding';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Null Node denotes the ASN.1 NULL value.
 */
export class NullNode extends Node<null> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Type;

  /**
   * Instantiates a new Null Node.
   *
   * @param options Optional parameters to customize the Node.
   */
  public constructor(options?: Optional<NodeOptions>);

  /**
   * Instantiates a new Null Node.
   *
   * @param data Null value.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: null, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new Null Node.
   *
   * @param dataOrOptions Null value or optional parameters to customize the Node.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(dataOrOptions?: Optional<null | NodeOptions>, options: Optional<NodeOptions> = {}) {
    if (dataOrOptions !== undefined && dataOrOptions !== null) {
      options = dataOrOptions;
    }

    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new UnsupportedEncodingException('The Null Type only supports the Primitive Encoding.');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Primitive;

    super(null, options);

    this.type = Type.Null;
  }
}
