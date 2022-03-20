import { KeyObject, sign, verify } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-json-web-key.exception';
import { InvalidSignatureException } from '../../exceptions/invalid-signature.exception';
import { EcKey } from '../../jwk/algorithms/ec/ec.key';
import { SupportedEllipticCurve } from '../../jwk/algorithms/ec/supported-elliptic-curve';
import { SupportedJsonWebKeyAlgorithm } from '../../jwk/algorithms/supported-jsonwebkey-algorithm';
import { SupportedJsonWebSignatureAlgorithm } from '../supported-jsonwebsignature-algorithm';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature.algorithm';

const signAsync = promisify(sign);
const verifyAsync = promisify(verify);

class EcdsaAlgorithm extends JsonWebSignatureAlgorithm {
  /**
   * Denotes the type of JSON Web Key supported by the JSON Web Signature ECDSA Algorithm.
   */
  protected readonly keyType: SupportedJsonWebKeyAlgorithm = 'EC';

  /**
   * Elliptic Curve used by the JSON Web Signature ECDSA Algorithm.
   */
  protected readonly curve: SupportedEllipticCurve;

  /**
   * Instantiates a new JSON Web Signature ECDSA Algorithm to Sign and Verify the Messages.
   *
   * @param hash Hash Algorithm used to Sign and Verify the Messages.
   * @param algorithm Name of the JSON Web Signature Algorithm.
   * @param curve Elliptic Curve used by the JSON Web Signature ECDSA Algorithm.
   */
  public constructor(hash: string, algorithm: SupportedJsonWebSignatureAlgorithm, curve: SupportedEllipticCurve) {
    super(hash, algorithm);

    this.curve = curve;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: EcKey): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const cryptoKey: KeyObject = Reflect.get(key, 'cryptoKey');

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
  public async verify(signature: Buffer, message: Buffer, key: EcKey): Promise<void> {
    this.validateJsonWebKey(key);

    const cryptoKey: KeyObject = Reflect.get(key, 'cryptoKey');

    const verificationResult = await verifyAsync(this.hash, message, cryptoKey, signature);

    if (!verificationResult) {
      throw new InvalidSignatureException();
    }
  }

  /**
   * Checks if the provided JSON Web Key can be used by the JSON Web Signature ECDSA Algorithm.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected validateJsonWebKey(key: EcKey): void {
    super.validateJsonWebKey(key);

    if (key.crv !== this.curve) {
      throw new InvalidJsonWebKeyException(
        `The JSON Web Signature ECDSA Algorithm "${this.algorithm}" only accepts the Elliptic Curve "${this.curve}".`
      );
    }
  }
}

/**
 * JSON Web Signature **ES256** Algorithm.
 */
export const ES256 = new EcdsaAlgorithm('SHA256', 'ES256', 'P-256');

/**
 * JSON Web Signature **ES384** Algorithm.
 */
export const ES384 = new EcdsaAlgorithm('SHA384', 'ES384', 'P-384');

/**
 * JSON Web Signature **ES512** Algorithm.
 */
export const ES512 = new EcdsaAlgorithm('SHA512', 'ES512', 'P-521');
