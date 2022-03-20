import { createHmac, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-json-web-key.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-json-web-signature.exception';
import { OctKey } from '../../jwk/algorithms/oct/oct.key';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature.algorithm';
import { SupportedJsonWebSignatureAlgorithm } from './types/supported-jsonwebsignature-algorithm';

/**
 * Implementation of the JSON Web Signature HMAC Algorithm.
 */
class HmacAlgorithm extends JsonWebSignatureAlgorithm {
  /**
   * Size of the Secret accepted by the JSON Web Signature HMAC Algorithm.
   */
  protected readonly keySize: number;

  /**
   * Instantiates a new JSON Web Signature HMAC Algorithm to Sign and Verify the Messages.
   *
   * @param hash Hash Algorithm used to Sign and Verify the Messages.
   * @param algorithm Name of the JSON Web Signature Algorithm.
   * @param keySize Size of the Secret accepted by the JSON Web Signature HMAC Algorithm.
   */
  public constructor(hash: string, algorithm: SupportedJsonWebSignatureAlgorithm, keySize: number) {
    super(hash, algorithm, 'oct');

    this.keySize = keySize;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: OctKey): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const cryptoKey: KeyObject = Reflect.get(key, 'cryptoKey');
    const signature = createHmac(this.hash!, cryptoKey).update(message).digest();

    return signature;
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key: OctKey): Promise<void> {
    this.validateJsonWebKey(key);

    const calculatedSignature = await this.sign(message, key);

    if (signature.compare(calculatedSignature) !== 0) {
      throw new InvalidJsonWebSignatureException();
    }
  }

  /**
   * Checks if the provided JSON Web Key can be used by the JSON Web Signature HMAC Algorithm.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected validateJsonWebKey(key: OctKey): void {
    super.validateJsonWebKey(key);

    if (Buffer.from(key.k, 'base64url').length < this.keySize) {
      throw new InvalidJsonWebKeyException(`The size of the OctKey Secret must be at least ${this.keySize} bytes.`);
    }
  }
}

/**
 * HMAC using SHA-256.
 */
export const HS256 = new HmacAlgorithm('SHA256', 'HS256', 32);

/**
 * HMAC using SHA-384.
 */
export const HS384 = new HmacAlgorithm('SHA384', 'HS384', 48);

/**
 * HMAC using SHA-512.
 */
export const HS512 = new HmacAlgorithm('SHA512', 'HS512', 64);
