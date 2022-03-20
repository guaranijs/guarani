import { Optional } from '@guarani/types';

import { Encoding } from '../encoding';
import { DecodingException } from '../exceptions/decoding.exception';
import { NodeOptions } from '../nodes/node.options';
import { Type } from '../type';
import { BerDecoder } from './ber.decoder';

/**
 * ASN.1 DER Decoder.
 */
export class DerDecoder extends BerDecoder {
  /**
   * Decodes a BitString Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Bit String.
   */
  public decodeBitString(options: Optional<NodeOptions> = {}): string {
    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new DecodingException('Unsupported Constructed Encoding for BitString.');
    }

    return super.decodeBitString(options);
  }

  /**
   * Decodes a Boolean Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Boolean.
   */
  public decodeBoolean(options: Optional<NodeOptions> = {}): boolean {
    const buffer = this.getSection(Type.Boolean, options);

    if (buffer.length !== 1) {
      throw new DecodingException('Invalid Boolean value.');
    }

    const byte = buffer[0];

    if (byte !== 0x00 && byte !== 0xff) {
      throw new DecodingException('Invalid Boolean value.');
    }

    return byte === 0xff;
  }

  /**
   * Decodes an OctetString Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Octet String.
   */
  public decodeOctetString(options: Optional<NodeOptions> = {}): Buffer {
    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new DecodingException('Unsupported Constructed Encoding for OctetString.');
    }

    return super.decodeOctetString(options);
  }
}
