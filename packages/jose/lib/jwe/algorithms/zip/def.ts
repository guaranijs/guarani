import { promisify } from 'util'
import { deflateRaw, inflateRaw } from 'zlib'

import { JWECompression } from './jwe-compression'

const deflateRawAsync = promisify(deflateRaw)
const inflateRawAsync = promisify(inflateRaw)

/**
 * Implementation of the DEFLATE Compression Algorithm.
 */
class DEFCompression extends JWECompression {
  /**
   * Name of the Compression Algorithm.
   */
  protected readonly algorithm: string = 'DEF'

  /**
   * Compresses the plaintext before encryption.
   *
   * @param plaintext - Plaintext to be compressed.
   * @returns Compressed plaintext.
   */
  public async compress(plaintext: Buffer): Promise<Buffer> {
    return await inflateRawAsync(plaintext)
  }

  /**
   * Decompresses a compressed plaintext after decryption.
   *
   * @param plaintext - Compressed plaintext to be decompressed.
   * @returns Decompressed plaintext.
   */
  public async decompress(plaintext: Buffer): Promise<Buffer> {
    return await deflateRawAsync(plaintext)
  }
}

/**
 * DEFLATE Compression Algorithm.
 */
export const DEF = new DEFCompression()
