import { Buffer } from 'buffer';
import { promisify } from 'util';
import { deflateRaw, inflateRaw } from 'zlib';

import { JsonWebEncryptionCompressionBackend } from './jsonwebencryption-compression.backend';

const deflateRawAsync = promisify(deflateRaw);
const inflateRawAsync = promisify(inflateRaw);

/**
 * Implementation of the DEFLATE JSON Web Encryption Compression Backend.
 */
class DEFBackend extends JsonWebEncryptionCompressionBackend {
  /**
   * Instantiates a new DEFLATE JSON Web Encryption Compression Backend to Compress and Decompress a Plaintext.
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
    return await deflateRawAsync(plaintext);
  }

  /**
   * Decompresses the provided Compressed Plaintext after Decryption.
   *
   * @param plaintext Compressed Plaintext to be Decompressed.
   * @returns Decompressed Plaintext.
   */
  public async decompress(plaintext: Buffer): Promise<Buffer> {
    return await inflateRawAsync(plaintext);
  }
}

/**
 * JSON Web Encryption **DEFLATE** Compression Algorithm.
 */
export const DEF = new DEFBackend();
