import { bufferToUnsignedInteger, integerToBuffer } from '@guarani/primitives';
import { Comparable, Nullable } from '@guarani/types';

import { Buffer } from 'buffer';
import { createHash, randomBytes } from 'crypto';

import { getMacAddress } from './utils/get-mac-address';
import { getTimeInGregorian100Nanoseconds } from './utils/get-time-in-gregorian-100-nanoseconds';
import { UUIDv1Options } from './uuid-v1.options';

let lastTimestamp: Nullable<bigint> = null;

/**
 * Implementation of RFC 4122.
 *
 * @see https://www.rfc-editor.org/rfc/rfc4122.html
 */
export class UUID implements Comparable<UUID> {
  /**
   * Representation of the NIL UUID (all bits set to zero).
   */
  public static readonly NIL = new UUID('00000000-0000-0000-0000-000000000000');

  /**
   * Representation of the MAX UUID (all bits set to one).
   */
  public static readonly MAX = new UUID('ffffffff-ffff-ffff-ffff-ffffffffffff');

  /**
   * Represents the DNS UUID.
   */
  public static readonly DNS_NAMESPACE = new UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

  /**
   * Represents the URL UUID.
   */
  public static readonly URL_NAMESPACE = new UUID('6ba7b811-9dad-11d1-80b4-00c04fd430c8');

  /**
   * Generates a random UUID v1.
   *
   * @param options UUID v1 options used to provide a stable state to the generator.
   * @returns Generated UUID v1.
   */
  public static v1(options: UUIDv1Options = {}): UUID {
    let timestamp = getTimeInGregorian100Nanoseconds();

    if (lastTimestamp !== null && timestamp <= lastTimestamp) {
      timestamp = lastTimestamp + 1n;
    }

    lastTimestamp = timestamp;

    const clockSequence = options.clockSequence ?? bufferToUnsignedInteger(randomBytes(2)) & 0x3fffn;

    const timestampLowField = timestamp & 0xffffffffn;
    const timestampMiddleField = (timestamp >> 32n) & 0xffffn;
    const timestampHighFieldAndVersion = (timestamp >> 48n) & 0x0fffn;
    const clockSequenceLowField = clockSequence & 0xffn;
    const clockSequenceHighFieldAndVariant = (clockSequence >> 8n) & 0x3fn;

    const node = options.node ?? bufferToUnsignedInteger(getMacAddress() ?? randomBytes(6));

    let uuidInteger =
      (timestampLowField << 96n) |
      (timestampMiddleField << 80n) |
      (timestampHighFieldAndVersion << 64n) |
      (((clockSequenceHighFieldAndVariant << 8n) | clockSequenceLowField) << 48n) |
      node;

    uuidInteger &= ~(0xc000n << 48n);
    uuidInteger |= 0x8000n << 48n;

    uuidInteger &= ~(0xf000n << 64n);
    uuidInteger |= 1n << 76n;

    return new UUID(integerToBuffer(uuidInteger));
  }

  /**
   * Generates a UUID v3 object from the MD5 of a Namespace UUID and a Name.
   *
   * @param namespace Namespace of the UUID.
   * @param name Name used to generate the UUID.
   * @returns Generated UUID v3.
   */
  public static v3(namespace: UUID, name: string): UUID {
    const bytes = createHash('md5').update(namespace.#bytes).update(name, 'utf8').digest();

    bytes[6] = (bytes[6]! & 0x0f) | 0x30;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;

    return new UUID(bytes.subarray(0, 16));
  }

  /**
   * Generates a random UUID v4.
   *
   * @returns Generated UUID v4.
   */
  public static v4(): UUID {
    const buffer = randomBytes(16);

    buffer[6] = (buffer[6]! & 0x0f) | 0x40;
    buffer[8] = (buffer[8]! & 0x3f) | 0x80;

    return new UUID(buffer);
  }

  /**
   * Generates a UUID v5 object from the SHA-1 of a Namespace UUID and a Name.
   *
   * @param namespace Namespace of the UUID.
   * @param name Name used to generate the UUID.
   * @returns Generated UUID v5.
   */
  public static v5(namespace: UUID, name: string): UUID {
    const bytes = createHash('sha1').update(namespace.#bytes).update(name, 'utf8').digest();

    bytes[6] = (bytes[6]! & 0x0f) | 0x50;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;

    return new UUID(bytes.subarray(0, 16));
  }

  /**
   * Underlying bytes representation of the UUID.
   */
  readonly #bytes!: Buffer;

  /**
   * Underlying bytes representation of the UUID.
   */
  public get bytes(): Buffer {
    return this.#bytes;
  }

  /**
   * Integer representation of the UUID.
   */
  public get int(): bigint {
    return bufferToUnsignedInteger(this.#bytes);
  }

  /**
   * Hexadecimal representation of the UUID.
   */
  public get hex(): string {
    return this.#bytes.toString('hex');
  }

  /**
   * URN representation of the UUID.
   */
  public get urn(): string {
    return `urn:uuid:${this.toString()}`;
  }

  /**
   * Returns the 1st through 4th hex octets of the UUID as an integer.
   */
  public get timestampLowField(): bigint {
    return this.int >> 96n;
  }

  /**
   * Returns the 5th and 6th hex octets of the UUID as an integer.
   */
  public get timestampMiddleField(): bigint {
    return (this.int >> 80n) & 0xffffn;
  }

  /**
   * Returns the 7th and 8th hex octets of the UUID as an integer.
   */
  public get timestampHighFieldAndVersion(): bigint {
    return (this.int >> 64n) & 0xffffn;
  }

  /**
   * Returns the 9th hex octet of the UUID as an integer.
   */
  public get clockSequenceHighFieldAndVariant(): bigint {
    return (this.int >> 56n) & 0xffn;
  }

  /**
   * Returns the 10th hex octet of the UUID as an integer.
   */
  public get clockSequenceLowField(): bigint {
    return (this.int >> 48n) & 0xffn;
  }

  /**
   * Returns the 11th through 16th hex octets of the UUID as an integer.
   */
  public get node(): bigint {
    return this.int & 0xffffffffffffn;
  }

  /**
   * Returns the Timestamp of the UUID as an integer.
   */
  public get timestamp(): bigint {
    return (
      ((this.timestampHighFieldAndVersion & 0x0fffn) << 48n) |
      (this.timestampMiddleField << 32n) |
      this.timestampLowField
    );
  }

  /**
   * Returns the Clock Sequence of the UUID as an integer.
   */
  public get clockSequence(): bigint {
    return ((this.clockSequenceHighFieldAndVariant & 0x3fn) << 8n) | this.clockSequenceLowField;
  }

  /**
   * Returns the Version of the UUID.
   */
  public get version(): number {
    return Number((this.int >> 76n) & 0x0fn);
  }

  /**
   * Instantiates a new UUID object.
   *
   * @param uuid Data representing the UUID.
   */
  public constructor(uuid: string | Buffer | UUID) {
    if (uuid instanceof UUID) {
      return uuid;
    }

    if (!Buffer.isBuffer(uuid) && typeof uuid !== 'string') {
      throw new TypeError('Invalid parameter "uuid".');
    }

    if (Buffer.isBuffer(uuid) && uuid.byteLength !== 16) {
      throw new TypeError('Invalid parameter "uuid".');
    }

    const uuidRegexp = /^(urn:uuid:)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (typeof uuid === 'string' && !uuidRegexp.test(uuid)) {
      throw new TypeError('Invalid parameter "uuid".');
    }

    this.#bytes = Buffer.isBuffer(uuid) ? uuid : Buffer.from(uuid.replaceAll(/(urn:uuid:)+|(-)+/g, ''), 'hex');
  }

  /**
   * Three-way comparison between two UUIDs.
   *
   * @param other UUID being compared.
   */
  public compare(other: UUID): number {
    return this.#bytes.compare(other.#bytes);
  }

  /**
   * Returns the string representation of the UUID.
   */
  public toString(): string {
    return [
      this.#bytes.subarray(0, 4).toString('hex'),
      this.#bytes.subarray(4, 6).toString('hex'),
      this.#bytes.subarray(6, 8).toString('hex'),
      this.#bytes.subarray(8, 10).toString('hex'),
      this.#bytes.subarray(10, 16).toString('hex'),
    ].join('-');
  }

  /**
   * Returns a JSON friendly representation of the UUID.
   */
  public toJSON(): string {
    return this.toString();
  }
}
