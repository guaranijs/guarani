import {
  createPrivateKey,
  createPublicKey,
  generateKeyPair,
  JsonWebKeyInput as CryptoJsonWebKeyInput,
  KeyObject,
} from 'crypto';
import { promisify } from 'util';

import { EllipticCurve } from '../elliptic-curve.type';
import { JsonWebKeyBackend } from '../jsonwebkey.backend';
import { EllipticCurveKey } from './elliptic-curve.key';
import { EllipticCurveKeyParameters } from './elliptic-curve.key.parameters';
import { GenerateEllipticCurveKeyOptions } from './generate-elliptic-curve-key.options';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Implementation of the Elliptic Curve JSON Web Key Backend.
 */
export class EllipticCurveBackend extends JsonWebKeyBackend {
  /**
   * Elliptic Curves supported by the Backend.
   */
  private readonly curves: Record<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>, string> = {
    'P-256': 'prime256v1',
    'P-384': 'secp384r1',
    'P-521': 'secp521r1',
  };

  /**
   * Loads the provided Elliptic Curve JSON Web Key Parameters into an Elliptic Curve JSON Web Key.
   *
   * @param parameters Elliptic Curve JSON Web Key Parameters.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns Elliptic Curve JSON Web Key.
   */
  public async load(
    data: EllipticCurveKeyParameters,
    additionalParameters?: Partial<EllipticCurveKeyParameters>,
  ): Promise<EllipticCurveKey> {
    return new (await import('./elliptic-curve.key')).EllipticCurveKey(data, additionalParameters);
  }

  /**
   * Generates a new Elliptic Curve JSON Web Key on the fly based on the provided options.
   *
   * @param options Options used to generate the Elliptic Curve JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public async generate(
    options: GenerateEllipticCurveKeyOptions,
    additionalParameters?: Partial<EllipticCurveKeyParameters>,
  ): Promise<EllipticCurveKey> {
    if (!Object.hasOwn(this.curves, options.curve)) {
      throw new TypeError(`Unsupported Elliptic Curve "${options.curve}" for JSON Web Key Type "EC".`);
    }

    const { privateKey } = await generateKeyPairAsync('ec', { namedCurve: this.curves[options.curve] });
    const data = privateKey.export({ format: 'jwk' }) as EllipticCurveKeyParameters;

    return new (await import('./elliptic-curve.key')).EllipticCurveKey(data, additionalParameters);
  }

  /**
   * Parses the Parameters of the Elliptic Curve JSON Web Key into a NodeJS Crypto Key.
   *
   * @param parameters Parameters of the Elliptic Curve JSON Web Key.
   */
  public getCryptoKey(parameters: EllipticCurveKeyParameters): KeyObject {
    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: parameters };
    return typeof parameters.d !== 'undefined' ? createPrivateKey(input) : createPublicKey(input);
  }

  /**
   * Returns a list with the private parameters of the Elliptic Curve JSON Web Key.
   */
  public getPrivateParameters(): string[] {
    return ['d'];
  }

  /**
   * Returns the parameters used to calculate the Thumbprint of the Elliptic Curve JSON Web Key in lexicographic order.
   *
   * @param parameters Parameters of the Elliptic Curve JSON Web Key.
   */
  protected getThumbprintParameters(parameters: EllipticCurveKeyParameters): EllipticCurveKeyParameters {
    return { crv: parameters.crv, kty: parameters.kty, x: parameters.x, y: parameters.y };
  }
}
