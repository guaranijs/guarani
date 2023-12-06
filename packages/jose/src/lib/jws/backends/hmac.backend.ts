import { Buffer } from 'buffer';
import { createHmac, createSecretKey, timingSafeEqual } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { OctetSequenceKey } from '../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

/**
 * Implementation of the JSON Web Signature HMAC Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-3.2
 */
export class HmacBackend extends JsonWebSignatureBackend {
  /**
   * Hash Algorithm used to Sign and Verify Messages.
   */
  protected readonly hash: string;

  /**
   * Size of the Secret accepted by the JSON Web Signature HMAC Backend.
   */
  protected readonly keySize: number;

  /**
   * Instantiates a new JSON Web Signature HMAC Backend to Sign and Verify Messages.
   *
   * @param keySize Size of the Secret accepted by the JSON Web Signature HMAC Backend.
   */
  public constructor(keySize: number) {
    const bitSize = keySize << 3;

    const algorithm = `HS${bitSize}` as JsonWebSignatureAlgorithm;

    super(algorithm);

    this.hash = `SHA${bitSize}`;
    this.keySize = keySize;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: OctetSequenceKey): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const cryptoKey = createSecretKey(key.k, 'base64url');

    return createHmac(this.hash, cryptoKey).update(message).digest();
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key: OctetSequenceKey): Promise<void> {
    this.validateJsonWebKey(key);

    const calculatedSignature = await this.sign(message, key);

    if (signature.length !== calculatedSignature.length || !timingSafeEqual(signature, calculatedSignature)) {
      throw new InvalidJsonWebSignatureException();
    }
  }

  /**
   * Checks if the provided JSON Web Key can be used by the JSON Web Signature HMAC Backend.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: OctetSequenceKey): void {
    super.validateJsonWebKey(key);

    if (key.kty !== 'oct') {
      throw new InvalidJsonWebKeyException(
        `The JSON Web Signature Algorithm "${this.algorithm}" only accepts "oct" JSON Web Keys.`,
      );
    }

    if (Buffer.byteLength(key.k, 'base64url') < this.keySize) {
      throw new InvalidJsonWebKeyException(`The jwk parameter "k" must be at least ${this.keySize} bytes.`);
    }
  }
}

/**
 * HMAC using SHA-256.
 */
export const HS256 = new HmacBackend(32);

/**
 * HMAC using SHA-384.
 */
export const HS384 = new HmacBackend(48);

/**
 * HMAC using SHA-512.
 */
export const HS512 = new HmacBackend(64);
