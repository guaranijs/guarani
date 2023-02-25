import { Buffer } from 'buffer';
import { sign, verify } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { EllipticCurve } from '../../jwk/backends/elliptic-curve.type';
import { OctetKeyPairKey } from '../../jwk/backends/octet-key-pair/octet-key-pair.key';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

const signAsync = promisify(sign);
const verifyAsync = promisify(verify);

/**
 * Implementation of the JSON Web Signature EdDSA Backend.
 */
class EddsaBackend extends JsonWebSignatureBackend {
  /**
   * Elliptic Curves used by the JSON Web Signature EdDSA Backend.
   */
  protected readonly curves: Extract<EllipticCurve, 'Ed25519' | 'Ed448'>[] = ['Ed25519', 'Ed448'];

  /**
   * Instantiates a new JSON Web Signature EdDSA Backend to Sign and Verify Messages.
   */
  public constructor() {
    super('EdDSA');
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: OctetKeyPairKey): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const { cryptoKey } = key;

    if (cryptoKey.type !== 'private') {
      throw new InvalidJsonWebKeyException('A Private Key is needed to Sign a JSON Web Signature Message.');
    }

    const signature = await signAsync(null, message, cryptoKey);

    return signature;
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key: OctetKeyPairKey): Promise<void> {
    this.validateJsonWebKey(key);

    const result = await verifyAsync(null, message, key.cryptoKey, signature);

    if (!result) {
      throw new InvalidJsonWebSignatureException();
    }
  }

  /**
   * Checks if the provided JSON Web Key can be used by the JSON Web Signature EdDSA Backend.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: OctetKeyPairKey): void {
    super.validateJsonWebKey(key);

    if (key.kty !== 'OKP') {
      throw new InvalidJsonWebKeyException('This JSON Web Signature Backend only accepts "OKP" JSON Web Keys.');
    }

    if (!this.curves.includes(<Extract<EllipticCurve, 'Ed25519' | 'Ed448'>>key.crv)) {
      throw new InvalidJsonWebKeyException(
        `The JSON Web Signature EdDSA Backend "${this.algorithm}" ` +
          `only accepts the Elliptic Curves ["${this.curves.join('", "')}"].`
      );
    }
  }
}

/**
 * EdDSA signature algorithms.
 */
export const EdDSA = new EddsaBackend();
