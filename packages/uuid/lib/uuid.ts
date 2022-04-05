import { bufferToInteger } from '@guarani/primitives';
import { Comparable, Optional } from '@guarani/types';

import { createHash, randomBytes } from 'crypto';

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc4122.html RFC 4122}.
 */
// TODO: Implement UUID v1.
export class UUID implements Comparable<UUID> {
  /**
   * Underlying bytes representation of the UUID.
   */
  public readonly bytes!: Buffer;

  /**
   * Integer representation of the UUID.
   */
  public readonly int!: bigint;

  public get time_low(): bigint {
    return this.int >> 96n;
  }

  public get time_mid(): bigint {
    return (this.int >> 80n) & 0xffffn;
  }

  public get time_hi_version(): bigint {
    return (this.int >> 64n) & 0xffffn;
  }

  public get clock_seq_hi_variant(): bigint {
    return (this.int >> 56n) & 0xffn;
  }

  public get clock_seq_low(): bigint {
    return (this.int >> 48n) & 0xffn;
  }

  public get time(): bigint {
    return ((this.time_hi_version & 0x0fffn) << 48n) | (this.time_mid << 32n) | this.time_low;
  }

  public get clock_seq(): bigint {
    return ((this.clock_seq_hi_variant & 0x3fn) << 8n) | this.clock_seq_low;
  }

  public get node(): bigint {
    return this.int & 0xffffffffffffn;
  }

  /**
   * URN representation of the UUID.
   */
  public get urn(): string {
    return `urn:uuid:${this}`;
  }

  /**
   * Hexadecimal representation of the UUID.
   */
  public get hex(): string {
    return this.int.toString(16);
  }

  /**
   * Returns the Version of the UUID.
   */
  public get version(): number {
    return Number((this.int >> 76n) & 0xfn);
  }

  /**
   * Instantiates a new UUID object.
   *
   * If no parameter is passed, it creates a UUID v4 object.
   * Otherwise, it will parse the provided value into a UUID object.
   *
   * @param value Data representing the UUID.
   */
  public constructor(value?: Optional<string | Buffer>) {
    if (value === undefined) {
      return UUID.v4();
    }

    if (!Buffer.isBuffer(value) && typeof value !== 'string') {
      throw new Error('Invalid UUID.');
    }

    this.bytes = Buffer.isBuffer(value)
      ? value
      : Buffer.from(value.replace('urn:', '').replace('uuid:', '').replace(/[{}]/g, '').replace(/-/g, ''), 'hex');

    if (this.bytes.length !== 16) {
      throw new Error('Invalid UUID.');
    }

    this.int = bufferToInteger(this.bytes);
  }

  /**
   * Representation of the NIL UUID (all zeroes).
   */
  public static readonly NIL = new UUID(Buffer.alloc(16));

  /**
   * Represents the DNS UUID.
   */
  public static readonly DNS = new UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

  /**
   * Represents the URL UUID.
   */
  public static readonly URL = new UUID('6ba7b811-9dad-11d1-80b4-00c04fd430c8');

  /**
   * Generates a random Buffer Array of 16 bytes.
   */
  private static _randomBytes(): Buffer {
    return randomBytes(16);
  }

  /**
   * Generates a UUID v3 object from the MD5 of a Namespace UUID and a Name.
   *
   * @param namespace Namespace of the UUID.
   * @param name Name used to generate the UUID.
   */
  public static v3(namespace: UUID, name: string): UUID {
    const bytes = createHash('md5').update(namespace.bytes).update(name, 'utf8').digest();

    bytes[6] = (bytes[6] & 0x0f) | 0x30;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return new UUID(bytes.subarray(0, 16));
  }

  /**
   * Generates a random UUID v4 object.
   */
  public static v4(): UUID {
    const buffer = this._randomBytes();

    buffer[6] = (buffer[6] & 0x0f) | 0x40;
    buffer[8] = (buffer[8] & 0x3f) | 0x80;

    return new UUID(buffer);
  }

  /**
   * Generates a UUID v5 object from the SHA-1 of a Namespace UUID and a Name.
   *
   * @param namespace Namespace of the UUID.
   * @param name Name used to generate the UUID.
   */
  public static v5(namespace: UUID, name: string): UUID {
    const bytes = createHash('sha1').update(namespace.bytes).update(name, 'utf8').digest();

    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return new UUID(bytes.subarray(0, 16));
  }

  /**
   * Three-way comparison between two UUIDs.
   *
   * @param other UUID being compared.
   */
  public compare(other: UUID): number {
    return this.bytes.compare(other.bytes);
  }

  /**
   * Returns the string representation of the UUID.
   */
  public toString(): string {
    return [
      this.bytes.subarray(0, 4).toString('hex'),
      this.bytes.subarray(4, 6).toString('hex'),
      this.bytes.subarray(6, 8).toString('hex'),
      this.bytes.subarray(8, 10).toString('hex'),
      this.bytes.subarray(10, 16).toString('hex'),
    ].join('-');
  }

  /**
   * Returns a JSON friendly representation of the UUID.
   */
  public toJSON(): string {
    return this.toString();
  }
}
