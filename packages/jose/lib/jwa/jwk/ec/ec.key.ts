import {
  createPrivateKey,
  createPublicKey,
  generateKeyPair,
  JsonWebKeyInput as CryptoJsonWebKeyInput,
  KeyObject,
} from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { JsonWebKeyAlgorithmParams } from '../jsonwebkey-algorithm.params';
import { JsonWebKeyAlgorithm } from '../jsonwebkey.algorithm';
import { ELLIPTIC_CURVES, ExportEcKeyOptions, GenerateEcKeyOptions } from './types';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Implementation of the Elliptic Curve Key Algorithm.
 */
export class EcKey implements JsonWebKeyAlgorithm {
  /**
   * Returns the SEC 1 Elliptic Curve Private Key DER Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns DER Encoded SEC 1 Elliptic Curve Private Key.
   */
  public async export(key: KeyObject, options: ExportEcKeyOptions<'der', 'sec1', 'private'>): Promise<Buffer>;

  /**
   * Returns the SEC 1 Elliptic Curve Private Key PEM Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns PEM Encoded SEC 1 Elliptic Curve Private Key.
   */
  public async export(key: KeyObject, options: ExportEcKeyOptions<'pem', 'sec1', 'private'>): Promise<string>;

  /**
   * Returns the PKCS#8 Elliptic Curve Private Key DER Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns DER Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public async export(key: KeyObject, options: ExportEcKeyOptions<'der', 'pkcs8', 'private'>): Promise<Buffer>;

  /**
   * Returns the PKCS#8 Elliptic Curve Private Key PEM Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns PEM Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public async export(key: KeyObject, options: ExportEcKeyOptions<'pem', 'pkcs8', 'private'>): Promise<string>;

  /**
   * Returns the SPKI Elliptic Curve Public Key DER Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns DER Encoded SPKI Elliptic Curve Public Key.
   */
  public async export(key: KeyObject, options: ExportEcKeyOptions<'der', 'spki', 'public'>): Promise<Buffer>;

  /**
   * Returns the SPKI Elliptic Curve Public Key PEM Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns PEM Encoded SPKI Elliptic Curve Public Key.
   */
  public async export(key: KeyObject, options: ExportEcKeyOptions<'pem', 'spki', 'public'>): Promise<string>;

  /**
   * Exports the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporing the NodeJS Key.
   * @returns Resulting Data.
   */
  public async export(
    key: KeyObject,
    options:
      | ExportEcKeyOptions<'der', 'sec1', 'private'>
      | ExportEcKeyOptions<'pem', 'sec1', 'private'>
      | ExportEcKeyOptions<'der', 'pkcs8', 'private'>
      | ExportEcKeyOptions<'pem', 'pkcs8', 'private'>
      | ExportEcKeyOptions<'der', 'spki', 'public'>
      | ExportEcKeyOptions<'pem', 'spki', 'public'>
  ): Promise<string | Buffer> {
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
      throw new TypeError('Unsupported format "spki" for type "private".');
    }

    if (type === 'public' && format !== 'spki') {
      throw new TypeError(`Unsupported format "${format}" for type "public".`);
    }

    if (key.type === 'public' && type === 'public') {
      return key.export({ type: format, format: <any>encoding });
    }

    if (key.type === 'private' && type === 'private') {
      return key.export({ type: format, format: <any>encoding });
    }

    if (key.type === 'private' && type === 'public') {
      const publicKey = createPublicKey({ format: 'jwk', key: key.export({ format: 'jwk' }) });
      return publicKey.export({ type: format, format: <any>encoding });
    }

    throw new TypeError('Cannot export private data from a public key.');
  }

  /**
   * Generates a NodeJS Key based on the provided parameters.
   *
   * @param options Parameters for the generation of a NodeJS Key.
   * @returns Generated NodeJS Key.
   */
  public async generate(options: GenerateEcKeyOptions): Promise<KeyObject> {
    const { curve } = options;

    const curveMeta = ELLIPTIC_CURVES.find((ellipticCurve) => ellipticCurve.id === curve);

    if (curveMeta === undefined) {
      throw new TypeError(`Unsupported Elliptic Curve "${curve}".`);
    }

    const { privateKey } = await generateKeyPairAsync('ec', { namedCurve: curveMeta.name });

    return privateKey;
  }

  /**
   * Loads the provided JSON Web Key into a NodeJS Key.
   *
   * @param jwk JSON Web Key to be loaded.
   * @returns Loaded NodeJS Key.
   */
  public load(jwk: JsonWebKeyAlgorithmParams): KeyObject {
    if (jwk.kty !== undefined && jwk.kty !== 'EC') {
      throw new InvalidJsonWebKeyException(`Invalid ley parameter "kty". Expected "EC", got "${jwk.kty}".`);
    }

    const curve = ELLIPTIC_CURVES.find((ellipticCurve) => ellipticCurve.id === jwk.crv);

    if (curve === undefined) {
      throw new InvalidJsonWebKeyException(`Unsupported curve "${jwk.crv}".`);
    }

    if (typeof jwk.x !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "x".');
    }

    if (typeof jwk.y !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "y".');
    }

    if (jwk.d !== undefined) {
      if (typeof jwk.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "d".');
      }
    }

    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: jwk };

    return jwk.d === undefined ? createPublicKey(input) : createPrivateKey(input);
  }
}
