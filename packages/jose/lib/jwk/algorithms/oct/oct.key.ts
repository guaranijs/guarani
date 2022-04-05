import { Optional } from '@guarani/types';

import { createSecretKey, KeyObject, randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { UnsupportedAlgorithmException } from '../../../exceptions/unsupported-algorithm.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { OctKeyParams } from './oct-key.params';
import { ExportOctKeyEncoding } from './types/export-oct-key-encoding';
import { ExportOctKeyOptions } from './types/export-oct-key.options';
import { GenerateOctKeyOptions } from './types/generate-oct-key.options';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7518.html#section-6.4 RFC 7518 Section 6.4}.
 */
export class OctKey extends JsonWebKey implements OctKeyParams {
  /**
   * Type of the JSON Web Key.
   */
  public readonly kty!: 'oct';

  /**
   * Base64Url encoded Octet.
   */
  public readonly k!: string;

  /**
   * Instantiates an Octet Sequence JSON Web Key based on the provided Parameters.
   *
   * @param key Parameters of the Octet Sequence JSON Web Key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: OctKeyParams, options: Optional<JsonWebKeyParams> = {}) {
    if (key instanceof OctKey) {
      return key;
    }

    const params = <OctKeyParams>{ ...key, ...options };

    if (typeof params.kty !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "kty".');
    }

    if (params.kty !== 'oct') {
      throw new UnsupportedAlgorithmException(`Invalid JSON Web Key Type. Expected "EC", got "${params.kty}".`);
    }

    if (typeof params.k !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "k".');
    }

    if (Buffer.from(params.k, 'base64url').length === 0) {
      throw new InvalidJsonWebKeyException('The Secret cannot be empty.');
    }

    super(params);
  }

  /**
   * Generates a new Octet Sequence JSON Web Key.
   *
   * @param options Options for the generation of the Octet Sequence JSON Web Key.
   * @param params Optional JSON Web Key Parameters.
   * @returns Generated Octet Sequence JSON Web Key.
   */
  public static async generate(
    options: GenerateOctKeyOptions,
    params: Optional<JsonWebKeyParams> = {}
  ): Promise<OctKey> {
    const { size } = options;

    if (!Number.isInteger(size)) {
      throw new TypeError('The Secret size must be a valid integer.');
    }

    if (size < 1) {
      throw new Error('The Secret size must be a positive integer.');
    }

    const buffer = await randomBytesAsync(size);

    return new OctKey({ kty: 'oct', k: buffer.toString('base64url') }, params);
  }

  /**
   * Loads the provided JSON Web Key into a NodeJS Crypto Key.
   *
   * @param params Parameters of the JSON Web Key.
   * @returns NodeJS Crypto Key.
   */
  protected loadCryptoKey(params: OctKeyParams): KeyObject {
    return createSecretKey(params.k, 'base64url');
  }

  /**
   * Exports the data of the Octet Sequence JSON Web Key into a String.
   *
   * @param options Options for exporting the data of the Octet Sequence JSON Web Key.
   * @returns Resulting String.
   */
  public export(options: ExportOctKeyOptions<globalThis.BufferEncoding>): string;

  /**
   * Exports the data of the Octet Sequence JSON Web Key into a Buffer.
   *
   * @param options Options for exporting the data of the Octet Sequence JSON Web Key.
   * @returns Resulting Buffer.
   */
  public export(options: ExportOctKeyOptions<'buffer'>): Buffer;

  /**
   * Exports the data of the Octet Sequence JSON Web Key.
   *
   * @param options Options for exporting the data of the Octet Sequence JSON Web Key.
   * @returns Resulting Object.
   */
  public export<T extends ExportOctKeyEncoding>(options: ExportOctKeyOptions<T>): string | Buffer {
    const { encoding } = options;

    if (typeof encoding !== 'string') {
      throw new TypeError('Invalid option "encoding".');
    }

    const secret = this.cryptoKey.export();

    return encoding === 'buffer' ? secret : secret.toString(encoding);
  }
}
