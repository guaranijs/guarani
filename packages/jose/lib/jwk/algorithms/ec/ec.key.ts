import { Optional } from '@guarani/types';

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPair,
  JsonWebKeyInput as CryptoJsonWebKeyInput,
  KeyExportOptions,
  KeyObject,
} from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { UnsupportedAlgorithmException } from '../../../exceptions/unsupported-algorithm.exception';
import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { EcKeyParams } from './ec-key.params';
import { ELLIPTIC_CURVES_REGISTRY } from './elliptic-curves-registry';
import { ExportEcKeyEncoding } from './types/export-ec-key-encoding';
import { ExportEcKeyFormat } from './types/export-ec-key-format';
import { ExportEcKeyType } from './types/export-ec-key-type';
import { ExportEcKeyOptions } from './types/export-ec-key.options';
import { GenerateEcKeyOptions } from './types/generate-ec-key.options';
import { SupportedEllipticCurve } from './types/supported-elliptic-curve';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7518.html#section-6.2 RFC 7518 Section 6.2}.
 */
export class EcKey extends JsonWebKey implements EcKeyParams {
  /**
   * Type of the JSON Web Key.
   */
  public readonly kty!: 'EC';

  /**
   * Name of the Elliptic Curve.
   */
  public readonly crv!: SupportedEllipticCurve;

  /**
   * X Coordinate.
   */
  public readonly x!: string;

  /**
   * Y Coordinate.
   */
  public readonly y!: string;

  /**
   * Private Key.
   */
  public readonly d?: Optional<string>;

  /**
   * Instantiates an Elliptic Curve JSON Web Key based on the provided Parameters.
   *
   * @param key Parameters of the Elliptic Curve JSON Web Key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: EcKeyParams, options: Optional<JsonWebKeyParams> = {}) {
    if (key instanceof EcKey) {
      return key;
    }

    const params = <EcKeyParams>{ ...key, ...options };

    if (typeof params.kty !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "kty".');
    }

    if (params.kty !== 'EC') {
      throw new UnsupportedAlgorithmException(`Invalid JSON Web Key Type. Expected "EC", got "${params.kty}".`);
    }

    if (typeof params.crv !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "crv".');
    }

    const curve = ELLIPTIC_CURVES_REGISTRY.find((ellipticCurve) => ellipticCurve.id === params.crv);

    if (curve === undefined) {
      throw new UnsupportedEllipticCurveException(`Unsupported Elliptic Curve "${params.crv}".`);
    }

    if (typeof params.x !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "x".');
    }

    if (typeof params.y !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "y".');
    }

    if (params.d !== undefined) {
      if (typeof params.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "d".');
      }
    }

    super(params);
  }

  /**
   * Generates a new Elliptic Curve JSON Web Key.
   *
   * @param options Options for the generation of the Elliptic Curve JSON Web Key.
   * @param params Optional JSON Web Key Parameters.
   * @returns Generated Elliptic Curve JSON Web Key.
   */
  public static async generate(options: GenerateEcKeyOptions, params: Optional<JsonWebKeyParams> = {}): Promise<EcKey> {
    const { curve } = options;

    if (typeof curve !== 'string') {
      throw new TypeError('Invalid option "curve".');
    }

    const curveMeta = ELLIPTIC_CURVES_REGISTRY.find((ellipticCurve) => ellipticCurve.id === curve);

    if (curveMeta === undefined) {
      throw new UnsupportedEllipticCurveException(`Unsupported Elliptic Curve "${curve}".`);
    }

    const { privateKey } = await generateKeyPairAsync('ec', { namedCurve: curveMeta.name });

    return new EcKey(<EcKeyParams>privateKey.export({ format: 'jwk' }), params);
  }

  /**
   * Loads the provided JSON Web Key into a NodeJS Crypto Key.
   *
   * @param params Parameters of the JSON Web Key.
   * @returns NodeJS Crypto Key.
   */
  protected loadCryptoKey(params: EcKeyParams): KeyObject {
    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: params };
    return params.d === undefined ? createPublicKey(input) : createPrivateKey(input);
  }

  /**
   * Exports the SEC 1 Elliptic Curve Private Key DER Encoding of the Elliptic Curve JSON Web Key.
   *
   * @param options Options for exporting the data of the Elliptic Curve JSON Web Key.
   * @returns DER Encoded SEC 1 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'der', 'sec1', 'private'>): Buffer;

  /**
   * Exports the SEC 1 Elliptic Curve Private Key PEM Encoding of the Elliptic Curve JSON Web Key.
   *
   * @param options Options for exporting the data of the Elliptic Curve JSON Web Key.
   * @returns PEM Encoded SEC 1 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'pem', 'sec1', 'private'>): string;

  /**
   * Exports the PKCS#8 Elliptic Curve Private Key DER Encoding of the Elliptic Curve JSON Web Key.
   *
   * @param options Options for exporting the data of the Elliptic Curve JSON Web Key.
   * @returns DER Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'der', 'pkcs8', 'private'>): Buffer;

  /**
   * Exports the PKCS#8 Elliptic Curve Private Key PEM Encoding of the Elliptic Curve JSON Web Key.
   *
   * @param options Options for exporting the data of the Elliptic Curve JSON Web Key.
   * @returns PEM Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'pem', 'pkcs8', 'private'>): string;

  /**
   * Exports the SPKI Elliptic Curve Public Key DER Encoding of the Elliptic Curve JSON Web Key.
   *
   * @param options Options for exporting the data of the Elliptic Curve JSON Web Key.
   * @returns DER Encoded SPKI Elliptic Curve Public Key.
   */
  public export(options: ExportEcKeyOptions<'der', 'spki', 'public'>): Buffer;

  /**
   * Exports the SPKI Elliptic Curve Public Key PEM Encoding of the Elliptic Curve JSON Web Key.
   *
   * @param options Options for exporting the data of the Elliptic Curve JSON Web Key.
   * @returns PEM Encoded SPKI Elliptic Curve Public Key.
   */
  public export(options: ExportEcKeyOptions<'pem', 'spki', 'public'>): string;

  /**
   * Exports the data of the Elliptic Curve JSON Web Key.
   *
   * @param options Options for exporting the data of the Elliptic Curve JSON Web Key.
   * @returns Encoded data of the Elliptic Curve JSON Web Key.
   */
  public export<E extends ExportEcKeyEncoding, F extends ExportEcKeyFormat, T extends ExportEcKeyType>(
    options: ExportEcKeyOptions<E, F, T>
  ): string | Buffer {
    const { encoding, format, type } = options;

    if (encoding !== 'der' && encoding !== 'pem') {
      throw new TypeError('Invalid option "encoding".');
    }

    if (format !== 'sec1' && format !== 'pkcs8' && format !== 'spki') {
      throw new TypeError('Invalid option "format".');
    }

    if (type !== 'private' && type !== 'public') {
      throw new TypeError('Invalid option "type".');
    }

    if (type === 'private' && format !== 'sec1' && format !== 'pkcs8') {
      throw new TypeError(`Unsupported format "${format}" for type "${type}".`);
    }

    if (type === 'public' && format !== 'spki') {
      throw new TypeError(`Unsupported format "${format}" for type "${type}".`);
    }

    if (this.cryptoKey.type === 'public' && type === 'private') {
      throw new TypeError('Cannot export private data from a public key.');
    }

    let { cryptoKey } = this;

    const input: KeyExportOptions<any> = { format: encoding, type: format };

    if (this.cryptoKey.type === 'private' && type === 'public') {
      cryptoKey = createPublicKey(cryptoKey);
    }

    let exported = cryptoKey.export(input);

    if (encoding === 'pem') {
      exported = exported.slice(0, -1);
    }

    return exported;
  }
}