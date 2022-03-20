/**
 * This class provides the expected **Plaintext Compression Algorithms**
 * that will be used throughout the package.
 *
 * All JWE Compressions **MUST** inherit from this class and
 * implement its methods.
 */
export abstract class JWECompression {
  /**
   * Name of the Compression Algorithm.
   */
  protected abstract readonly algorithm: string;

  /**
   * Compresses the plaintext before encryption.
   *
   * @param plaintext Plaintext to be compressed.
   * @returns Compressed plaintext.
   */
  public abstract compress(plaintext: Buffer): Promise<Buffer>;

  /**
   * Decompresses a compressed plaintext after decryption.
   *
   * @param plaintext Compressed plaintext to be decompressed.
   * @returns Decompressed plaintext.
   */
  public abstract decompress(plaintext: Buffer): Promise<Buffer>;
}
