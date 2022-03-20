import { promisify } from 'util';
import { deflateRaw, inflateRaw } from 'zlib';
import { SupportedJsonWebEncryptionCompressionAlgorithm } from '../../supported-jsonwebencryption-compression-algorithm';
import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression.algorithm';

const deflateRawAsync = promisify(deflateRaw);
const inflateRawAsync = promisify(inflateRaw);

/**
 * Implementation of the DEFLATE Compression Algorithm.
 */
class DefCompressionAlgorithm extends JsonWebEncryptionCompressionAlgorithm {
  /**
   * Name of the JSON Web Encryption Compression Algorithm.
   */
  protected readonly algorithm: SupportedJsonWebEncryptionCompressionAlgorithm = 'DEF';

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
 * DEFLATE Compression Algorithm.
 */
export const DEF = new DefCompressionAlgorithm();
