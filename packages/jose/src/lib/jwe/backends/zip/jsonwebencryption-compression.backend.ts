import { Buffer } from 'buffer';

import { JsonWebEncryptionCompressionAlgorithm } from '../../jsonwebencryption-compression-algorithm.type';

/**
 * Abstract Base Class for the JSON Web Encryption Compression Backends.
 *
 * All JSON Web Encryption Compression Backends **MUST** extend this base class and implement its abstract methods.
 */
export abstract class JsonWebEncryptionCompressionBackend {
  /**
   * Instantiates a new JSON Web Encryption Compression Backend to Compress and Decompress a Plaintext.
   *
   * @param algorithm Name of the JSON Web Encryption Compression Backend.
   */
  public constructor(protected readonly algorithm: JsonWebEncryptionCompressionAlgorithm) {}

  /**
   * Compresses the provided Plaintext before Encryption.
   *
   * @param plaintext Plaintext to be Compressed.
   * @returns Compressed Plaintext.
   */
  public abstract compress(plaintext: Buffer): Promise<Buffer>;

  /**
   * Decompresses the provided Compressed Plaintext after Decryption.
   *
   * @param plaintext Compressed Plaintext to be Decompressed.
   * @returns Decompressed Plaintext.
   */
  public abstract decompress(plaintext: Buffer): Promise<Buffer>;
}
