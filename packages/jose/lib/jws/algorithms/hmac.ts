import { createHmac, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-json-web-key.exception';
import { InvalidSignatureException } from '../../exceptions/invalid-signature.exception';
import { OctKey } from '../../jwk/algorithms/oct/oct.key';
import { SupportedJsonWebKeyAlgorithm } from '../../jwk/algorithms/supported-jsonwebkey-algorithm';
import { SupportedJsonWebSignatureAlgorithm } from '../supported-jsonwebsignature-algorithm';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature.algorithm';

class HmacAlgorithm extends JsonWebSignatureAlgorithm {
  /**
   * Denotes the type of JSON Web Key supported by the JSON Web Signature HMAC Algorithm.
   */
  public readonly keyType: SupportedJsonWebKeyAlgorithm = 'oct';

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
    super(hash, algorithm);

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
      throw new InvalidSignatureException();
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
 * JSON Web Signature **HS256** Algorithm.
 */
export const HS256 = new HmacAlgorithm('SHA256', 'HS256', 32);

/**
 * JSON Web Signature **HS384** Algorithm.
 */
export const HS384 = new HmacAlgorithm('SHA384', 'HS384', 48);

/**
 * JSON Web Signature **HS512** Algorithm.
 */
export const HS512 = new HmacAlgorithm('SHA512', 'HS512', 64);
