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
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { EcKeyParams } from './ec-key.params';
import { ELLIPTIC_CURVES_REGISTRY } from './elliptic-curves-registry';
import { ExportEcKeyOptions } from './export-ec-key.options';
import { GenerateEcKeyOptions } from './generate-ec-key.options';
import { SupportedEllipticCurve } from './supported-elliptic-curve';
import { ExportEcKeyEncoding, ExportEcKeyFormat, ExportEcKeyType } from './types';

const generateKeyPairAsync = promisify(generateKeyPair);

export class EcKey extends JsonWebKey implements EcKeyParams {
  /**
   * Key type representing the algorithm of the key.
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
   * Instantiates an EcKey based on the provided parameters.
   *
   * @param key Parameters of the key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: EcKeyParams, options: Optional<JsonWebKeyParams> = {}) {
    if (key instanceof EcKey) {
      return key;
    }

    const params = <EcKeyParams>{ ...key, ...options };

    if (params.kty !== undefined && params.kty !== 'EC') {
      throw new InvalidJsonWebKeyException(`Invalid key parameter "kty". Expected "EC", got "${params.kty}".`);
    }

    const curve = ELLIPTIC_CURVES_REGISTRY.find((ellipticCurve) => ellipticCurve.id === params.crv);

    if (curve === undefined) {
      throw new InvalidJsonWebKeyException(`Unsupported Elliptic Curve "${params.crv}".`);
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
   * Generates a new EcKey.
   *
   * @param options Options for the generation of the EcKey.
   * @param params Optional JSON Web Key Parameters.
   * @returns Generated EcKey.
   */
  public static async generate(options: GenerateEcKeyOptions, params: Optional<JsonWebKeyParams> = {}): Promise<EcKey> {
    const { curve } = options;

    const curveMeta = ELLIPTIC_CURVES_REGISTRY.find((ellipticCurve) => ellipticCurve.id === curve);

    if (curveMeta === undefined) {
      throw new TypeError(`Unsupported Elliptic Curve "${curve}".`);
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
   * Exports the SEC 1 Elliptic Curve Private Key DER Encoding of the EcKey.
   *
   * @param options Options for exporting the data of the EcKey.
   * @returns DER Encoded SEC 1 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'der', 'sec1', 'private'>): Buffer;

  /**
   * Exports the SEC 1 Elliptic Curve Private Key PEM Encoding of the EcKey.
   *
   * @param options Options for exporting the data of the EcKey.
   * @returns PEM Encoded SEC 1 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'pem', 'sec1', 'private'>): string;

  /**
   * Exports the PKCS#8 Elliptic Curve Private Key DER Encoding of the EcKey.
   *
   * @param options Options for exporting the data of the EcKey.
   * @returns DER Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'der', 'pkcs8', 'private'>): Buffer;

  /**
   * Exports the PKCS#8 Elliptic Curve Private Key PEM Encoding of the EcKey.
   *
   * @param options Options for exporting the data of the EcKey.
   * @returns PEM Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public export(options: ExportEcKeyOptions<'pem', 'pkcs8', 'private'>): string;

  /**
   * Exports the SPKI Elliptic Curve Public Key DER Encoding of the EcKey.
   *
   * @param options Options for exporting the data of the EcKey.
   * @returns DER Encoded SPKI Elliptic Curve Public Key.
   */
  public export(options: ExportEcKeyOptions<'der', 'spki', 'public'>): Buffer;

  /**
   * Exports the SPKI Elliptic Curve Public Key PEM Encoding of the EcKey.
   *
   * @param options Options for exporting the data of the EcKey.
   * @returns PEM Encoded SPKI Elliptic Curve Public Key.
   */
  public export(options: ExportEcKeyOptions<'pem', 'spki', 'public'>): string;

  /**
   * Exports the data of the EcKey.
   *
   * @param options Options for exporting the data of the EcKey.
   * @returns Encoded data of the EcKey.
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

    return cryptoKey.export(input);
  }
}
