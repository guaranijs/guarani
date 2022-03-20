import { promisify } from 'util';
import { deflateRaw, inflateRaw } from 'zlib';

import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression.algorithm';

const deflateRawAsync = promisify(deflateRaw);
const inflateRawAsync = promisify(inflateRaw);

/**
 * Implementation of the DEFLATE JSON Web Encryption Compression Algorithm.
 */
class DefCompressionAlgorithm extends JsonWebEncryptionCompressionAlgorithm {
  /**
   * Instantiates a new Deflate JSON Web Encryption Compression Algorithm to Compress and Decompress a Plaintext.
   */
  public constructor() {
    super('DEF');
  }

  /**
   * Compresses the provided Plaintext before Encryption.
   *
   * @param plaintext Plaintext to be Compressed.
   * @returns Compressed Plaintext.
   */
  public async compress(plaintext: Buffer): Promise<Buffer> {
    return await inflateRawAsync(plaintext);
  }

  /**
   * Decompresses the provided Compressed Plaintext after Decryption.
   *
   * @param plaintext Compressed Plaintext to be Decompressed.
   * @returns Decompressed Plaintext.
   */
  public async decompress(plaintext: Buffer): Promise<Buffer> {
    return await deflateRawAsync(plaintext);
  }
}

/**
 * JSON Web Encryption **DEFLATE** Compression Algorithm.
 */
export const DEF = new DefCompressionAlgorithm();
