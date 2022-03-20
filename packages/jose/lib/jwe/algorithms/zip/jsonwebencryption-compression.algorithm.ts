import { SupportedJsonWebEncryptionCompressionAlgorithm } from './supported-jsonwebencryption-compression-algorithm';

/**
 * Abstract Base Class for the JSON Web Encryption Compression Algorithms.
 *
 * All JSON Web Encryption Compression Algorithms supported by Guarani **MUST** extend this base class
 * and implement its abstract methods.
 */
export abstract class JsonWebEncryptionCompressionAlgorithm {
  /**
   * Name of the JSON Web Encryption Compression Algorithm.
   */
  protected readonly algorithm: SupportedJsonWebEncryptionCompressionAlgorithm;

  /**
   * Instantiates a new JSON Web Encryption Compression Algorithm to Compress and Decompress a Plaintext.
   *
   * @param algorithm Name of the JSON Web Encryption Compression Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionCompressionAlgorithm) {
    this.algorithm = algorithm;
  }

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
