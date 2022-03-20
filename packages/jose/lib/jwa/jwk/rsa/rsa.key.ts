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
import { ExportRsaKeyOptions, GenerateRsaKeyOptions } from './types';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Implementation of the RSA Key Algorithm.
 */
export class RsaKey implements JsonWebKeyAlgorithm {
  /**
   * Returns the PKCS#1 RSA Private Key DER Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns DER Encoded PKCS#1 RSA Private Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'der', 'pkcs1', 'private'>): Promise<Buffer>;

  /**
   * Returns the PKCS#1 RSA Private Key PEM Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns PEM Encoded PKCS#1 RSA Private Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'pem', 'pkcs1', 'private'>): Promise<string>;

  /**
   * Returns the PKCS#8 RSA Private Key DER Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns DER Encoded PKCS#8 RSA Private Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'der', 'pkcs8', 'private'>): Promise<Buffer>;

  /**
   * Returns the PKCS#8 RSA Private Key PEM Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns PEM Encoded PKCS#8 RSA Private Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'pem', 'pkcs8', 'private'>): Promise<string>;

  /**
   * Returns the PKCS#1 RSA Public Key DER Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns DER Encoded PKCS#1 RSA Public Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'der', 'pkcs1', 'public'>): Promise<Buffer>;

  /**
   * Returns the PKCS#1 RSA Public Key PEM Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns PEM Encoded PKCS#1 RSA Public Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'pem', 'pkcs1', 'public'>): Promise<string>;

  /**
   * Returns the SPKI RSA Public Key DER Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns DER Encoded SPKI RSA Public Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'der', 'spki', 'public'>): Promise<Buffer>;

  /**
   * Returns the SPKI RSA Public Key PEM Encoding of the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporting the NodeJS Key.
   * @returns PEM Encoded SPKI RSA Public Key.
   */
  public async export(key: KeyObject, options: ExportRsaKeyOptions<'pem', 'spki', 'public'>): Promise<string>;

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
      | ExportRsaKeyOptions<'der', 'pkcs1', 'private'>
      | ExportRsaKeyOptions<'pem', 'pkcs1', 'private'>
      | ExportRsaKeyOptions<'der', 'pkcs8', 'private'>
      | ExportRsaKeyOptions<'pem', 'pkcs8', 'private'>
      | ExportRsaKeyOptions<'der', 'pkcs1', 'public'>
      | ExportRsaKeyOptions<'pem', 'pkcs1', 'public'>
      | ExportRsaKeyOptions<'der', 'spki', 'public'>
      | ExportRsaKeyOptions<'pem', 'spki', 'public'>
  ): Promise<string | Buffer> {
    const { encoding, format, type } = options;

    if (encoding !== 'der' && encoding !== 'pem') {
      throw new TypeError('Invalid option "encoding".');
    }

    if (format !== 'pkcs1' && format !== 'pkcs8' && format !== 'spki') {
      throw new TypeError('Invalid option "format".');
    }

    if (type !== 'private' && type !== 'public') {
      throw new TypeError('Invalid option "type".');
    }

    if (type === 'private' && format !== 'pkcs1' && format !== 'pkcs8') {
      throw new TypeError('Unsupported format "spki" for type "private".');
    }

    if (type === 'public' && format !== 'pkcs1' && format !== 'spki') {
      throw new TypeError('Unsupported format "pkcs8" for type "public".');
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
  public async generate(options: GenerateRsaKeyOptions): Promise<KeyObject> {
    const { modulus, publicExponent } = options;

    if (!Number.isInteger(modulus)) {
      throw new TypeError('Invalid parameter "modulus".');
    }

    if (publicExponent !== undefined && !Number.isInteger(publicExponent)) {
      throw new TypeError('Invalid parameter "publicExponent".');
    }

    if (modulus < 2048) {
      throw new Error('The modulus must be at least 2048 bits.');
    }

    const { privateKey } = await generateKeyPairAsync('rsa', { modulusLength: modulus, publicExponent });

    return privateKey;
  }

  /**
   * Loads the provided JSON Web Key into a NodeJS Key.
   *
   * @param jwk JSON Web Key to be loaded.
   * @returns Loaded NodeJS Key.
   */
  public load(jwk: JsonWebKeyAlgorithmParams): KeyObject {
    if (jwk.kty !== undefined && jwk.kty !== 'RSA') {
      throw new InvalidJsonWebKeyException(`Invalid key parameter "kty". Expected "RSA", got "${jwk.kty}".`);
    }

    if (typeof jwk.n !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "n".');
    }

    if (Buffer.from(jwk.n, 'base64url').length < 256) {
      throw new InvalidJsonWebKeyException('The modulus MUST have AT LEAST 2048 bits.');
    }

    if (typeof jwk.e !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "e".');
    }

    // TODO: Validate the following values based on the previous ones.
    if (jwk.d !== undefined) {
      if (typeof jwk.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "d".');
      }

      if (typeof jwk.p !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "p".');
      }

      if (typeof jwk.q !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "q".');
      }

      if (typeof jwk.dp !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "dp".');
      }

      if (typeof jwk.dq !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "dq".');
      }

      if (typeof jwk.qi !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "qi".');
      }
    }

    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: jwk };

    return jwk.d === undefined ? createPublicKey(input) : createPrivateKey(input);
  }
}
