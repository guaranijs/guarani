import { randomBytes } from 'crypto'

// TODO: Add tests.

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc4122.html RFC 4122}.
 */
export class UUID {
  /**
   * Underlying bytes representation of the UUID.
   */
  private readonly bytes!: Buffer

  /**
   * Instantiates a new UUID v4 object.
   */
  public constructor()

  /**
   * Parses, validates and wraps the provided UUID string.
   *
   * @param uuid UUID string to be parsed.
   */
  public constructor(uuid: string)

  /**
   * Parses, validates and wraps the provided UUID Buffer.
   *
   * @param uuid UUID Buffer to be parsed.
   */
  public constructor(buffer: Buffer)

  /**
   * Guard for passing a UUID object into the constructor.
   *
   * @param uuid UUID object.
   */
  public constructor(uuid: UUID)

  /**
   * Instantiates a new UUID object.
   *
   * @param uuidOrBuffer Data representing the UUID.
   */
  public constructor(uuidOrBuffer?: string | Buffer | UUID) {
    if (uuidOrBuffer == null) {
      return UUID.v4()
    }

    if (uuidOrBuffer instanceof UUID) {
      return uuidOrBuffer
    }

    if (!Buffer.isBuffer(uuidOrBuffer) && typeof uuidOrBuffer !== 'string') {
      throw new Error('Invalid UUID.')
    }

    this.bytes = Buffer.isBuffer(uuidOrBuffer)
      ? uuidOrBuffer
      : Buffer.from(uuidOrBuffer.replace(/-/g, ''), 'hex')

    if (this.bytes.length !== 16) {
      throw new Error('Invalid UUID')
    }
  }

  /**
   * Generates a random bytearray of 16 bytes.
   */
  private static _randomBytes(): Buffer {
    return randomBytes(16)
  }

  /**
   * Representation of the NIL UUID (all zeroes).
   */
  public static readonly NIL: UUID = new UUID(Buffer.alloc(16))

  /**
   * Generates a random UUID v4 object.
   */
  public static v4(): UUID {
    const buffer = this._randomBytes()

    buffer[6] = (buffer[6] & 0x0f) | 0x40
    buffer[8] = (buffer[8] & 0x3f) | 0x80

    return new UUID(buffer)
  }

  /**
   * Returns the string representation of the UUID.
   *
   * @param separate Indicates whether or not to separate the data with dashes.
   */
  public toString(separate: boolean = true): string {
    return [
      this.bytes.subarray(0, 4).toString('hex'),
      this.bytes.subarray(4, 6).toString('hex'),
      this.bytes.subarray(6, 8).toString('hex'),
      this.bytes.subarray(8, 10).toString('hex'),
      this.bytes.subarray(10, 16).toString('hex')
    ].join(separate === true ? '-' : '')
  }
}
