import { createPrivateKey, createPublicKey, JsonWebKeyInput as CryptoJsonWebKeyInput, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';
import { JsonWebKeyBackend } from '../jsonwebkey.backend';
import { EcKeyParameters } from './eckey.parameters';
import { EllipticCurve } from './elliptic-curve.type';

/**
 * Implementation of the **Elliptic Curve** JSON Web Key Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-6.2
 */
export class EcKeyBackend implements JsonWebKeyBackend {
  /**
   * Private Parameters of the JSON Web Key Elliptic Curve Backend.
   */
  public readonly privateParameters: string[] = ['d'];

  /**
   * Loads the provided JSON Web Key Parameters into a NodeJS Crypto Key.
   *
   * @param parameters JSON Web Key Parameters.
   * @returns NodeJS Crypto Key.
   */
  public load(parameters: JsonWebKeyParameters): KeyObject {
    if (!this.checkIsEllipticCurveKey(parameters)) {
      throw new InvalidJsonWebKeyException('The provided parameters do not represent a valid "EC" key.');
    }

    this.validateParameters(parameters);

    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: parameters };
    return parameters.d === undefined ? createPublicKey(input) : createPrivateKey(input);
  }

  /**
   * Checks if the provided JSON Web Key Parameters object is a valid Elliptic Curve Key Parameters object.
   *
   * @param parameters JSON Web Key Parameters object to be checked.
   */
  private checkIsEllipticCurveKey(parameters: JsonWebKeyParameters): parameters is EcKeyParameters {
    return Object.hasOwn(parameters, 'crv') && Object.hasOwn(parameters, 'x') && Object.hasOwn(parameters, 'y');
  }

  /**
   * Validates the provided Elliptic Curve JSON Web Key Parameters.
   *
   * @param parameters Parameters of the Elliptic Curve JSON Web Key.
   */
  public validateParameters(parameters: EcKeyParameters): void {
    if (typeof parameters.crv !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "crv".');
    }

    if (!(<EllipticCurve[]>['P-256', 'P-384', 'P-521']).includes(parameters.crv)) {
      throw new UnsupportedEllipticCurveException(`Unsupported Elliptic Curve "${parameters.crv}".`);
    }

    if (typeof parameters.x !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "x".');
    }

    if (typeof parameters.y !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "y".');
    }

    if (parameters.d !== undefined) {
      if (typeof parameters.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "d".');
      }
    }
  }
}
