import { Optional } from '@guarani/types';

import { Encoding } from '../encoding';
import { DecodingException } from '../exceptions/decoding.exception';
import { Type } from '../type';
import { BerDecoder } from './ber.decoder';
import { NodeOptionsWithTransformer } from './decoder';

export class DerDecoder<TModel extends object> extends BerDecoder<TModel> {
  /**
   * Decodes a BitString Type.
   */
  // TODO: Make it multi-level recursive.
  protected decodeBitString(options: Optional<NodeOptionsWithTransformer> = {}): string {
    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new DecodingException('Unsupported Constructed Encoding for BitString.');
    }

    return super.decodeBitString(options);
  }

  /**
   * Decodes a Boolean Type.
   */
  protected decodeBoolean(options: Optional<NodeOptionsWithTransformer> = {}): boolean {
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
   * Parses an OctetString Type.
   */
  protected decodeOctetString(options: Optional<NodeOptionsWithTransformer> = {}): string {
    if (options.encoding !== undefined && options.encoding !== Encoding.Primitive) {
      throw new DecodingException('Unsupported Constructed Encoding for OctetString.');
    }

    return super.decodeOctetString(options);
  }
}
