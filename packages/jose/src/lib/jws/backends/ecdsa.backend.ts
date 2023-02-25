import { Buffer } from 'buffer';
import { sign, verify } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { EllipticCurve } from '../../jwk/backends/elliptic-curve.type';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

const signAsync = promisify(sign);
const verifyAsync = promisify(verify);

/**
 * Implementation of the JSON Web Signature ECDSA Backend.
 */
class EcdsaBackend extends JsonWebSignatureBackend {
  /**
   * Hash Algorithm used to Sign and Verify Messages.
   */
  protected readonly hash: string;

  /**
   * Elliptic Curve used by the JSON Web Signature ECDSA Backend.
   */
  protected readonly curve: EllipticCurve;

  /**
   * Instantiates a new JSON Web Signature ECDSA Backend to Sign and Verify Messages.
   *
   * @param algorithm Name of the JSON Web Signature Backend.
   * @param hash Hash Algorithm used to Sign and Verify Messages.
   * @param curve Elliptic Curve used by the JSON Web Signature ECDSA Backend.
   */
  public constructor(algorithm: JsonWebSignatureAlgorithm, hash: string, curve: EllipticCurve) {
    super(algorithm);

    this.hash = hash;
    this.curve = curve;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: JsonWebKey): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const { cryptoKey } = key;

    if (cryptoKey.type !== 'private') {
      throw new InvalidJsonWebKeyException('A Private Key is needed to Sign a JSON Web Signature Message.');
    }

    const signature = await signAsync(this.hash, message, cryptoKey);

    return signature;
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key: JsonWebKey): Promise<void> {
    this.validateJsonWebKey(key);

    const result = await verifyAsync(this.hash, message, key.cryptoKey, signature);

    if (!result) {
      throw new InvalidJsonWebSignatureException();
    }
  }

  /**
   * Checks if the provided JSON Web Key can be used by the JSON Web Signature ECDSA Algorithm.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: JsonWebKey): void {
    super.validateJsonWebKey(key);

    if (key.crv !== this.curve) {
      throw new InvalidJsonWebKeyException(
        `The JSON Web Signature ECDSA Algorithm "${this.algorithm}" only accepts the Elliptic Curve "${this.curve}".`
      );
    }
  }
}

/**
 * ECDSA using P-256 and SHA-256.
 */
export const ES256 = new EcdsaBackend('ES256', 'SHA256', 'P-256');

/**
 * ECDSA using P-384 and SHA-384.
 */
export const ES384 = new EcdsaBackend('ES384', 'SHA384', 'P-384');

/**
 * ECDSA using P-521 and SHA-512.
 */
export const ES512 = new EcdsaBackend('ES512', 'SHA512', 'P-521');
