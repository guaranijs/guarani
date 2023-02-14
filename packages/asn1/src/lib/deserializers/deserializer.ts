import { Buffer } from 'buffer';

import { NodeOptions } from '../nodes/node.options';

/**
 * Base ASN.1 Deserializer.
 */
export abstract class Asn1Deserializer<T> {
  /**
   * ASN.1 Data to be deserialized.
   */
  protected data: T;

  /**
   * Instantiates a new ASN.1 Deserializer.
   *
   * @param data ASN.1 Data to be deserialized.
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
   * Deserializes a BitString Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Bit String.
   */
  public abstract bitstring(options?: NodeOptions): string;

  /**
   * Deserializes a Boolean Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Boolean.
   */
  public abstract boolean(options?: NodeOptions): boolean;

  /**
   * Returns the first N bytes of the Deserializer's data.
   *
   * @param length Number of bytes to be returned.
   * @returns First N bytes of the Deserializer's data.
   */
  public abstract bytes(length: number): Buffer;

  /**
   * Deserializes an Integer Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Integer.
   */
  public abstract integer(options?: NodeOptions): bigint;

  /**
   * Deserializes a Null Type.
   *
   * @param options Optional attributes for the Node.
   * @returns `null`.
   */
  public abstract null(options?: NodeOptions): null;

  /**
   * Deserializes an ObjectIdentifier Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Object Identifier.
   */
  public abstract objectidentifier(options?: NodeOptions): string;

  /**
   * Deserializes an OctetString Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Octet String.
   */
  public abstract octetstring(options?: NodeOptions): Buffer;

  /**
   * Deserializes a Sequence Type
   *
   * @param options Optional attributes for the Node.
   * @returns Deserializer for the Children Nodes of the Sequence.
   */
  public abstract sequence(options?: NodeOptions): Asn1Deserializer<T>;
}
