import { Buffer } from 'buffer';

import { Asn1Type } from '../types/asn1-type.type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The OctetString Node denotes an arbitrary sequence of octets.
 * It is used to represent a sequence of bytes as a hexadecimal String.
 */
export class OctetStringNode extends Node<Buffer | OctetStringNode[]> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Asn1Type = 'octetstring';

  /**
   * Instantiates a new OctetString object based on the provided String.
   *
   * @param data String representation of the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string, options?: NodeOptions);

  /**
   * Instantiates a new OctetString object based on the provided Buffer.
   *
   * @param data Buffer representation of the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: Buffer, options?: NodeOptions);

  /**
   * Instantiates a new OctetString Node based on the provided OctetString Nodes.
   *
   * @param data Substrings of the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: OctetStringNode[], options?: NodeOptions);

  /**
   * Instantiates a new OctetString object based on the provided data.
   *
   * @param data Data representing the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: string | Buffer | OctetStringNode[], options: NodeOptions = {}) {
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

      if (typeof options.encoding !== 'undefined' && options.encoding !== 'primitive') {
        throw new TypeError('This configuration expects a Primitive Encoding.');
      }

      data = Buffer.from(data, 'hex');

      options.encoding = 'primitive';
    }

    // Buffer Branch.
    else if (Buffer.isBuffer(data)) {
      if (typeof options.encoding !== 'undefined' && options.encoding !== 'primitive') {
        throw new TypeError('This configuration expects a Primitive Encoding.');
      }

      options.encoding = 'primitive';
    }

    // Constructed Branch.
    else {
      if (data.some((node) => !(node instanceof OctetStringNode) || node.class !== 'universal')) {
        throw new TypeError('Invalid parameter "data".');
      }

      if (typeof options.encoding !== 'undefined' && options.encoding !== 'constructed') {
        throw new TypeError('This configuration expects a Constructed Encoding.');
      }

      options.encoding = 'constructed';
    }

    options.class ??= 'universal';

    super(data, options);
  }
}
