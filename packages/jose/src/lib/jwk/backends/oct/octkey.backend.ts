import { Buffer } from 'buffer';
import { createSecretKey, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';
import { JsonWebKeyBackend } from '../jsonwebkey.backend';
import { OctKeyParameters } from './octkey.parameters';

/**
 * Implementation of the **Octet Sequence** JSON Web Key Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-6.4
 */
export class OctKeyBackend implements JsonWebKeyBackend {
  /**
   * Required Parameters of the JSON Web Key Octet Sequence Backend.
   */
  public readonly requiredParameters: string[] = ['kty', 'k'];

  /**
   * Private Parameters of the JSON Web Key Octet Sequence Backend.
   */
  public readonly privateParameters: string[] = ['k'];

  /**
   * Loads the provided JSON Web Key Parameters into a NodeJS Crypto Key.
   *
   * @param parameters JSON Web Key Parameters.
   * @returns NodeJS Crypto Key.
   */
  public load(parameters: JsonWebKeyParameters): KeyObject {
    if (!this.checkIsOctetKey(parameters)) {
      throw new InvalidJsonWebKeyException('The provided parameters do not represent a valid "oct" key.');
    }

    this.validateParameters(parameters);

    return createSecretKey(parameters.k, 'base64url');
  }

  /**
   * Checks if the provided JSON Web Key Parameters object is a valid Octet Key Parameters object.
   *
   * @param parameters JSON Web Key Parameters object to be checked.
   */
  private checkIsOctetKey(parameters: JsonWebKeyParameters): parameters is OctKeyParameters {
    return Object.hasOwn(parameters, 'k');
  }

  /**
   * Validates the provided Octet Sequence JSON Web Key Parameters.
   *
   * @param parameters Parameters of the Octet Sequence JSON Web Key.
   */
  private validateParameters(parameters: OctKeyParameters): void {
    if (typeof parameters.k !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "k".');
    }

    if (Buffer.byteLength(parameters.k, 'base64url') === 0) {
      throw new InvalidJsonWebKeyException('The Secret cannot be empty.');
    }
  }
}
