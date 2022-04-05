import { Optional } from '@guarani/types';

import { NodeOptions } from '../nodes/node.options';

/**
 * Base ASN.1 Decoder.
 */
export abstract class Decoder<T> {
  /**
   * ASN.1 Data to be decoded.
   */
  protected data: T;

  /**
   * Instantiates a new ASN.1 Decoder.
   *
   * @param data ASN.1 Data to be decoded.
   */
  public constructor(data: T) {
    this.data = data;
  }

  /**
   * Checks if the current encoded ASN.1 Type has the provided Tag.
   *
   * @param tag Expected Tag.
   */
  public abstract is(tag: number): boolean;

  /**
   * Decodes a BitString Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Bit String.
   */
  public abstract decodeBitString(options?: Optional<NodeOptions>): string;

  /**
   * Decodes a Boolean Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Boolean.
   */
  public abstract decodeBoolean(options?: Optional<NodeOptions>): boolean;

  /**
   * Returns the first N bytes of the Decoder's data.
   *
   * @param length Number of bytes to be returned.
   * @returns First N bytes of the Decoder's data.
   */
  public abstract decodeBytes(length: number): Buffer;

  /**
   * Decodes an Integer Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Integer.
   */
  public abstract decodeInteger(options?: Optional<NodeOptions>): bigint;

  /**
   * Decodes a Null Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns `null`.
   */
  public abstract decodeNull(options?: Optional<NodeOptions>): null;

  /**
   * Decodes an ObjectIdentifier Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Object Identifier.
   */
  public abstract decodeObjectIdentifier(options?: Optional<NodeOptions>): string;

  /**
   * Decodes an OctetString Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Octet String.
   */
  public abstract decodeOctetString(options?: Optional<NodeOptions>): Buffer;

  /**
   * Decodes a Sequence Type
   *
   * @param options Optional attributes for the Node.
   * @returns Decoder for the Children Nodes of the Sequence.
   */
  public abstract decodeSequence(options?: Optional<NodeOptions>): Decoder<T>;
}
