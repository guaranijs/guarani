import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The OctetString Node denotes an arbitrary sequence of octets.
 * It is used to represent a sequence of bytes represented in hex.
 */
export class OctetStringNode extends Node<Buffer> {
  /**
   * Type Identifier of the Node.
   */
  protected static readonly type: Type = Type.OctetString;

  /**
   * Instantiates a new OctetString object based on the provided value.
   *
   * @param value Buffer representation of the OctetString.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(value: Buffer, options: Optional<NodeOptions> = {}) {
    if (!Buffer.isBuffer(value)) {
      throw new TypeError('Invalid parameter "value".');
    }

    if (options.method === Method.Constructed) {
      throw new Error('Unsupported Constructed Method for OctetString.');
    }

    options.class ??= Class.Universal;
    options.method ??= Method.Primitive;

    super(value, options);
  }

  /**
   * Encodes the OctetString Node into a Buffer object.
   *
   * @example
   * const octstr = new OctetStringNode(Buffer.from([0x02, 0x0d, 0x4f, 0x9e, 0xb3]))
   * octstr.encode() // <Buffer 04 05 02 0d 4f 9e b3>
   */
  protected encodeData(): Buffer {
    return this.value;
  }
}
