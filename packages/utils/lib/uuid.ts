import { randomBytes } from 'crypto'

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc4122.html RFC 4122}.
 */
export class UUID {
  /**
   * Underlying bytes representation of the UUID.
   */
  private readonly bytes: Buffer

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

  public constructor(uuidOrBuffer?: string | Buffer) {
    if (!uuidOrBuffer) {
      return UUID.v4()
    } else {
      if (!Buffer.isBuffer(uuidOrBuffer) && typeof uuidOrBuffer !== 'string') {
        throw new Error('Invalid UUID.')
      }

      if (Buffer.isBuffer(uuidOrBuffer)) {
        this.bytes = uuidOrBuffer
      }

      if (typeof uuidOrBuffer === 'string') {
        this.bytes = Buffer.from(uuidOrBuffer.replace(/-/g, ''), 'hex')
      }
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

  public toString(): string {
    return [
      this.bytes.subarray(0, 4).toString('hex'),
      this.bytes.subarray(4, 6).toString('hex'),
      this.bytes.subarray(6, 8).toString('hex'),
      this.bytes.subarray(8, 10).toString('hex'),
      this.bytes.subarray(10, 16).toString('hex')
    ].join('-')
  }
}
