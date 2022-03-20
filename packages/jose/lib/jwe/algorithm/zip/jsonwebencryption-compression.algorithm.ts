import { SupportedJsonWebEncryptionCompressionAlgorithm } from '../../supported-jsonwebencryption-compression-algorithm';

/**
 * This class provides the expected **Plaintext Compression Algorithms** that will be used throughout the package.
 *
 * All JSON Web Encryption Compression Algorithms **MUST** inherit from this class and implement its methods.
 */
export abstract class JsonWebEncryptionCompressionAlgorithm {
  /**
   * Name of the JSON Web Encryption Compression Algorithm.
   */
  protected abstract readonly algorithm: SupportedJsonWebEncryptionCompressionAlgorithm;

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
