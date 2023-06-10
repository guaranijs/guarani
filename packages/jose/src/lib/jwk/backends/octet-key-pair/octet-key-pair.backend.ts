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
import { GenerateOctetKeyPairKeyOptions } from './generate-octet-key-pair-key.options';
import { OctetKeyPairKey } from './octet-key-pair.key';
import { OctetKeyPairKeyParameters } from './octet-key-pair.key.parameters';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Implementation of the Octet Key Pair JSON Web Key Backend.
 */
export class OctetKeyPairBackend extends JsonWebKeyBackend {
  /**
   * Elliptic Curves supported by the Backend.
   */
  private readonly curves: Record<Extract<EllipticCurve, 'Ed25519' | 'Ed448' | 'X25519' | 'X448'>, string> = {
    Ed25519: 'ed25519',
    Ed448: 'ed448',
    X25519: 'x25519',
    X448: 'x448',
  };

  /**
   * Loads the provided Octet Key Pair JSON Web Key Parameters into an Octet Key Pair JSON Web Key.
   *
   * @param parameters Octet Key Pair JSON Web Key Parameters.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns Octet Key Pair JSON Web Key.
   */
  public async load(
    data: OctetKeyPairKeyParameters,
    additionalParameters?: Partial<OctetKeyPairKeyParameters>
  ): Promise<OctetKeyPairKey> {
    return new (await import('./octet-key-pair.key')).OctetKeyPairKey(data, additionalParameters);
  }

  /**
   * Generates a new Octet Key Pair JSON Web Key on the fly based on the provided options.
   *
   * @param options Options used to generate the Octet Key Pair JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public async generate(
    options: GenerateOctetKeyPairKeyOptions,
    additionalParameters?: Partial<OctetKeyPairKeyParameters>
  ): Promise<OctetKeyPairKey> {
    if (!Object.hasOwn(this.curves, options.curve)) {
      throw new TypeError(`Unsupported Elliptic Curve "${options.curve}" for JSON Web Key Type "OKP".`);
    }

    const { privateKey } = await generateKeyPairAsync(<any>this.curves[options.curve]);
    const data = privateKey.export({ format: 'jwk' }) as OctetKeyPairKeyParameters;

    return new (await import('./octet-key-pair.key')).OctetKeyPairKey(data, additionalParameters);
  }

  /**
   * Parses the Parameters of the Octet Key Pair JSON Web Key into a NodeJS Crypto Key.
   *
   * @param parameters Parameters of the Octet Key Pair JSON Web Key.
   */
  public getCryptoKey(parameters: OctetKeyPairKeyParameters): KeyObject {
    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: parameters };
    return typeof parameters.d !== 'undefined' ? createPrivateKey(input) : createPublicKey(input);
  }

  /**
   * Returns a list with the private parameters of the Octet Key Pair JSON Web Key.
   */
  public getPrivateParameters(): string[] {
    return ['d'];
  }

  /**
   * Returns the parameters used to calculate the Thumbprint of the Octet Key Pair JSON Web Key in lexicographic order.
   *
   * @param parameters Parameters of the Octet Key Pair JSON Web Key.
   */
  protected getThumbprintParameters(parameters: OctetKeyPairKeyParameters): OctetKeyPairKeyParameters {
    return { crv: parameters.crv, kty: parameters.kty, x: parameters.x };
  }
}
