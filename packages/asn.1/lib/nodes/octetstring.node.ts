import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Encoding } from '../encoding';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The OctetString Node denotes an arbitrary sequence of octets.
 * It is used to represent a sequence of bytes represented in hex.
 */
export class OctetStringNode extends Node<string | OctetStringNode[]> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Type;

  /**
   * Instantiates a new OctetString object based on the provided String.
   *
   * @param data String representation of the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new OctetString object based on the provided Buffer.
   *
   * @param data Buffer representation of the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: Buffer, options?: Optional<NodeOptions>);

  /**
   * Instantiates a new OctetString Node based on the provided OctetString Nodes.
   *
   * @param data Substrings of the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: OctetStringNode[], options?: Optional<NodeOptions>);

  /**
   * Instantiates a new OctetString object based on the provided data.
   *
   * @param data Data representing the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string | Buffer | OctetStringNode[], options: Optional<NodeOptions> = {}) {
    if (typeof data !== 'string' && !Buffer.isBuffer(data) && !Array.isArray(data)) {
      throw new TypeError('Invalid parameter "data".');
    }

    // String Branch.
    if (typeof data === 'string') {
      if (data.length % 2 !== 0) {
        data = `0${data}`;
      }

      const hexRegex = /^[0-9a-fA-F]*$/;

      if (!hexRegex.test(data)) {
        throw new TypeError('Invalid parameter "data".');
      }

      if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
        throw new TypeError('This configuration expects a Primitive Encoding.');
      }

      options.encoding = Encoding.Primitive;
    }

    // Buffer Branch.
    else if (Buffer.isBuffer(data)) {
      if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
        throw new TypeError('This configuration expects a Primitive Encoding.');
      }

      data = data.toString('hex');

      options.encoding = Encoding.Primitive;
    }

    // Constructed Branch.
    else {
      if (data.some((node) => !(node instanceof OctetStringNode) || node.class !== Class.Universal)) {
        throw new TypeError('Invalid parameter "data".');
      }

      if (options.encoding !== undefined && options.encoding !== Encoding.Constructed) {
        throw new TypeError('This configuration expects a Constructed Encoding.');
      }

      options.encoding = Encoding.Constructed;
    }

    options.class ??= Class.Universal;

    super(data, options);

    this.type = Type.OctetString;
  }
}
