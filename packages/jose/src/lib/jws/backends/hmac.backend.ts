import { Buffer } from 'buffer';
import { createHmac, timingSafeEqual } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { OctKeyParameters } from '../../jwk/backends/oct/octkey.parameters';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { JsonWebKeyType } from '../../jwk/jsonwebkey-type.enum';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.enum';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

/**
 * Implementation of the JSON Web Signature HMAC Backend.
 */
class HmacBackend extends JsonWebSignatureBackend {
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

    const algorithm = `HS${bitSize}`;
    const hash = `SHA${bitSize}`;

    super(<JsonWebSignatureAlgorithm>algorithm, hash, JsonWebKeyType.Octet);

    this.keySize = keySize;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: JsonWebKey<OctKeyParameters>): Promise<Buffer> {
    this.validateJsonWebKey(key);
    return createHmac(this.hash!, key.cryptoKey).update(message).digest();
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key: JsonWebKey<OctKeyParameters>): Promise<void> {
    this.validateJsonWebKey(key);

    const calculatedSignature = await this.sign(message, key);

    if (!timingSafeEqual(signature, calculatedSignature)) {
      throw new InvalidJsonWebSignatureException();
    }
  }

  /**
   * Checks if the provided JSON Web Key can be used by the JSON Web Signature HMAC Algorithm.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: JsonWebKey<OctKeyParameters>): void {
    super.validateJsonWebKey(key);

    if (Buffer.from(<string>key.k, 'base64url').length < this.keySize) {
      throw new InvalidJsonWebKeyException(`The size of the OctKey Secret must be at least ${this.keySize} bytes.`);
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
