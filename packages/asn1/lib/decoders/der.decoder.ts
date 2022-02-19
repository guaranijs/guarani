import { Optional } from '@guarani/types';

import { DecodingException } from '../exceptions/decoding.exception';
import { Method } from '../method';
import { NodeOptions } from '../nodes/node.options';
import { Type } from '../type';
import { BerDecoder } from './ber.decoder';

export class DerDecoder<TModel> extends BerDecoder<TModel> {
  /**
   * Parses a BitString Type.
   */
  protected decodeBitString(options?: Optional<NodeOptions>): Buffer {
    if (options?.method !== Method.Primitive) {
      throw new DecodingException('Unsupported Constructed Method for BitString.');
    }

    let [type, buffer] = this.slice(Type.BitString, options);

    if ((type & Method.Constructed) !== 0x00) {
      throw new DecodingException('Unsupported Constructed Method for BitString.');
    }

    if (buffer.length > 1 && buffer[0] === 0x00) {
      buffer = buffer.subarray(1);
    }

    return buffer;
  }

  /**
   * Parses an OctetString Type.
   */
  protected decodeOctetString(options?: NodeOptions): Buffer {
    if (options?.method !== Method.Primitive) {
      throw new DecodingException('Unsupported Constructed Method for OctetString.');
    }

    const [type, buffer] = this.slice(Type.OctetString, options);

    if ((type & Method.Constructed) !== 0x00) {
      throw new DecodingException('Unsupported Constructed Method for OctetString.');
    }

    return buffer;
  }
}
