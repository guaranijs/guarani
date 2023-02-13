import { Buffer } from 'buffer';
import { promisify } from 'util';
import { deflateRaw, inflateRaw } from 'zlib';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { JoseException } from '../../../exceptions/jose.exception';
import { JsonWebEncryptionCompressionAlgorithm } from '../../jsonwebencryption-compression-algorithm.enum';
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
    super(JsonWebEncryptionCompressionAlgorithm.DEF);
  }

  /**
   * Compresses the provided Plaintext before Encryption.
   *
   * @param plaintext Plaintext to be Compressed.
   * @returns Compressed Plaintext.
   */
  public async compress(plaintext: Buffer): Promise<Buffer> {
    try {
      return await deflateRawAsync(plaintext);
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebEncryptionException();
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Decompresses the provided Compressed Plaintext after Decryption.
   *
   * @param plaintext Compressed Plaintext to be Decompressed.
   * @returns Decompressed Plaintext.
   */
  public async decompress(plaintext: Buffer): Promise<Buffer> {
    try {
      return await inflateRawAsync(plaintext);
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebEncryptionException();
      exception.cause = exc;

      throw exception;
    }
  }
}

/**
 * JSON Web Encryption **DEFLATE** Compression Algorithm.
 */
export const DEF = new DEFBackend();
