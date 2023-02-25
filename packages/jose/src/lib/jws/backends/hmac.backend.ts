import { Buffer } from 'buffer';
import { createHmac, createSecretKey, timingSafeEqual } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { OctetSequenceKey } from '../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

/**
 * Implementation of the JSON Web Signature HMAC Backend.
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

    const algorithm = <JsonWebSignatureAlgorithm>`HS${bitSize}`;

    super(algorithm);

    this.hash = `sha${bitSize}`;
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
      throw new InvalidJsonWebKeyException('This JSON Web Signature Backend only accepts "oct" JSON Web Keys.');
    }

    if (Buffer.byteLength(key.k, 'base64url') < this.keySize) {
      throw new InvalidJsonWebKeyException(
        `The size of the Octet Sequence Key Secret must be at least ${this.keySize} bytes.`
      );
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
