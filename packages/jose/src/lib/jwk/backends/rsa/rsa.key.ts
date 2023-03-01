import { Buffer } from 'buffer';
import { createPrivateKey, createPublicKey, JsonWebKeyInput as CryptoJsonWebKeyInput, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { RsaKeyParameters } from './rsa.key.parameters';

/**
 * Implementation of an RSA JSON Web Key.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-6.3
 */
export class RsaKey extends JsonWebKey<RsaKeyParameters> implements RsaKeyParameters {
  /**
   * RSA JSON Web Key Type.
   */
  public override readonly kty!: 'RSA';

  /**
   * RSA Modulus.
   */
  public readonly n!: string;

  /**
   * RSA Public Exponent.
   */
  public readonly e!: string;

  /**
   * RSA Private Exponent.
   */
  public readonly d?: string;

  /**
   * RSA First Prime Factor.
   */
  public readonly p?: string;

  /**
   * RSA Second Prime Factor.
   */
  public readonly q?: string;

  /**
   * RSA First Factor CRT Exponent.
   */
  public readonly dp?: string;

  /**
   * RSA Second Factor CRT Exponent.
   */
  public readonly dq?: string;

  /**
   * RSA First Factor CRT Coefficient.
   */
  public readonly qi?: string;

  /**
   * Parses the Parameters of the JSON Web Key into a NodeJS Crypto Key.
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  protected getCryptoKey(parameters: RsaKeyParameters): KeyObject {
    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: parameters };
    return parameters.d !== undefined ? createPrivateKey(input) : createPublicKey(input);
  }

  /**
   * Returns the parameters used to calculate the Thumbprint of the JSON Web Key in lexicographic order.
   */
  protected getThumbprintParameters(): RsaKeyParameters {
    return { e: this.e, kty: this.kty, n: this.n };
  }

  /**
   * Returns a list with the private parameters of the JSON Web Key.
   */
  protected getPrivateParameters(): string[] {
    return ['d', 'p', 'q', 'dp', 'dq', 'qi'];
  }

  /**
   * Validates the provided RSA JSON Web Key Parameters.
   *
   * @param parameters Parameters of the RSA JSON Web Key.
   */
  protected override validateParameters(parameters: RsaKeyParameters): void {
    if (parameters.kty !== 'RSA') {
      throw new TypeError(`Unexpected JSON Web Key Type "${parameters.kty}" for RsaKey.`);
    }

    if (typeof parameters.n !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "n".');
    }

    if (Buffer.byteLength(parameters.n, 'base64url') < 256) {
      throw new InvalidJsonWebKeyException('The RSA Modulus MUST be at least 2048.');
    }

    if (typeof parameters.e !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "e".');
    }

    if (this.getPrivateParameters().some((parameter) => parameters[parameter] !== undefined)) {
      if (typeof parameters.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid jwk parameter "d".');
      }

      if (typeof parameters.p !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid jwk parameter "p".');
      }

      if (typeof parameters.q !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid jwk parameter "q".');
      }

      if (typeof parameters.dp !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid jwk parameter "dp".');
      }

      if (typeof parameters.dq !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid jwk parameter "dq".');
      }

      if (typeof parameters.qi !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid jwk parameter "qi".');
      }
    }

    super.validateParameters(parameters);
  }
}
