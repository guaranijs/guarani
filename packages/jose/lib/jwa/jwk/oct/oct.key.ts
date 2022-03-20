import { createSecretKey, KeyObject, randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { JsonWebKeyAlgorithmParams } from '../jsonwebkey-algorithm.params';
import { JsonWebKeyAlgorithm } from '../jsonwebkey.algorithm';
import { ExportOctKeyOptions, GenerateOctKeyOptions } from './types';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of the Octet Key Algorithm.
 */
export class OctKey implements JsonWebKeyAlgorithm {
  /**
   * Exports the provided NodeJS Key into a Base64 Encoded String.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporing the NodeJS Key.
   * @returns Resulting String.
   */
  public async export(key: KeyObject, options: ExportOctKeyOptions<'base64'>): Promise<string>;

  /**
   * Exports the provided NodeJS Key into a Buffer.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporing the NodeJS Key.
   * @returns Resulting Buffer.
   */
  public async export(key: KeyObject, options: ExportOctKeyOptions<'buffer'>): Promise<Buffer>;

  /**
   * Exports the provided NodeJS Key.
   *
   * @param key NodeJS Key to be exported.
   * @param options Parameters for exporing the NodeJS Key.
   * @returns Resulting Data.
   */
  public async export(
    key: KeyObject,
    options: ExportOctKeyOptions<'base64'> | ExportOctKeyOptions<'buffer'>
  ): Promise<string | Buffer> {
    const { format } = options;

    if (format !== 'base64' && format !== 'buffer') {
      throw new Error('Invalid option "format".');
    }

    const secret = key.export();

    return format === 'base64' ? secret.toString('base64') : secret;
  }

  /**
   * Generates a NodeJS Key based on the provided parameters.
   *
   * @param options Parameters for the generation of a NodeJS Key.
   * @returns Generated NodeJS Key.
   */
  public async generate(options: GenerateOctKeyOptions): Promise<KeyObject> {
    const { size } = options;

    if (!Number.isInteger(size)) {
      throw new TypeError('The Secret size must be a valid integer.');
    }

    if (size < 1) {
      throw new Error('The Secret size must be a positive integer.');
    }

    const buffer = await randomBytesAsync(size);

    return createSecretKey(buffer);
  }

  /**
   * Loads the provided JSON Web Key into a NodeJS Key.
   *
   * @param jwk JSON Web Key to be loaded.
   * @returns Loaded NodeJS Key.
   */
  public load(jwk: JsonWebKeyAlgorithmParams): KeyObject {
    if (jwk.kty !== undefined && jwk.kty !== 'oct') {
      throw new InvalidJsonWebKeyException(`Invalid key parameter "kty". Expected "oct", got "${jwk.kty}".`);
    }

    if (typeof jwk.k !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "k".');
    }

    if (jwk.k.length < 2) {
      throw new InvalidJsonWebKeyException('The Secret size must be a positive integer.');
    }

    return createSecretKey(jwk.k, 'base64url');
  }
}
