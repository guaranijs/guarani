import { Buffer } from 'buffer';
import { createPrivateKey, createPublicKey, JsonWebKeyInput as CryptoJsonWebKeyInput, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';
import { JsonWebKeyBackend } from '../jsonwebkey.backend';
import { RsaKeyParameters } from './rsakey.parameters';

/**
 * Implementation of the **RSA** JSON Web Key Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-6.3
 */
export class RsaKeyBackend implements JsonWebKeyBackend {
  /**
   * Private Parameters of the JSON Web Key RSA Backend.
   */
  public readonly privateParameters: string[] = ['d', 'p', 'q', 'dp', 'dq', 'qi'];

  /**
   * Loads the provided JSON Web Key Parameters into a NodeJS Crypto Key.
   *
   * @param parameters JSON Web Key Parameters.
   * @returns NodeJS Crypto Key.
   */
  public load(parameters: JsonWebKeyParameters): KeyObject {
    if (!this.checkIsRsaKey(parameters)) {
      throw new InvalidJsonWebKeyException('The provided parameters do not represent a valid "RSA" key.');
    }

    this.validateParameters(parameters);

    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: parameters };
    return parameters.d === undefined ? createPublicKey(input) : createPrivateKey(input);
  }

  /**
   * Checks if the provided JSON Web Key Parameters object is a valid RSA Key Parameters object.
   *
   * @param parameters JSON Web Key Parameters object to be checked.
   */
  private checkIsRsaKey(parameters: JsonWebKeyParameters): parameters is RsaKeyParameters {
    if (!Object.hasOwn(parameters, 'n') || !Object.hasOwn(parameters, 'e')) {
      return false;
    }

    return (
      this.privateParameters.every((parameter) => Object.hasOwn(parameters, parameter)) ||
      this.privateParameters.every((parameter) => !Object.hasOwn(parameters, parameter))
    );
  }

  /**
   * Validates the provided RSA JSON Web Key Parameters.
   *
   * @param parameters Parameters of the RSA JSON Web Key.
   */
  private validateParameters(parameters: RsaKeyParameters): void {
    if (typeof parameters.n !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "n".');
    }

    if (Buffer.byteLength(parameters.n, 'base64url') < 256) {
      throw new InvalidJsonWebKeyException('The modulus MUST have AT LEAST 2048 bits.');
    }

    if (typeof parameters.e !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "e".');
    }

    // TODO: Validate the following values based on the previous ones.
    if (this.privateParameters.some((parameter) => parameters[parameter] !== undefined)) {
      if (typeof parameters.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "d".');
      }

      if (typeof parameters.p !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "p".');
      }

      if (typeof parameters.q !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "q".');
      }

      if (typeof parameters.dp !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "dp".');
      }

      if (typeof parameters.dq !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "dq".');
      }

      if (typeof parameters.qi !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "qi".');
      }
    }
  }
}
