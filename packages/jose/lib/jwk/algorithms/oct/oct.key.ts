import { Optional } from '@guarani/types';

import { createSecretKey, KeyObject, randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { ExportOctKeyOptions } from './export-oct-key.options';
import { GenerateOctKeyOptions } from './generate-oct-key.options';
import { OctKeyParams } from './oct-key.params';
import { ExportOctKeyEncoding, SUPPORTED_OCTKEY_ENCODINGS } from './types';

const randomBytesAsync = promisify(randomBytes);

export class OctKey extends JsonWebKey implements OctKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty!: 'oct';

  /**
   * Base64Url encoded Octet.
   */
  public readonly k!: string;

  /**
   * Instantiates an OctKey based on the provided parameters.
   *
   * @param key Parameters of the key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: OctKeyParams, options: Optional<JsonWebKeyParams> = {}) {
    if (key instanceof OctKey) {
      return key;
    }

    const params = <OctKeyParams>{ ...key, ...options };

    if (params.kty !== undefined && params.kty !== 'oct') {
      throw new InvalidJsonWebKeyException(`Invalid key parameter "kty". Expected "oct", got "${params.kty}".`);
    }

    if (typeof params.k !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "k".');
    }

    if (params.k.length < 2) {
      throw new InvalidJsonWebKeyException('The Secret size must be a positive integer.');
    }

    super(params);
  }

  /**
   * Generates a new OctKey.
   *
   * @param options Options for the generation of the OctKey.
   * @param params Optional JSON Web Key Parameters.
   * @returns Generated OctKey.
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
   * Exports the data of the OctKey into a String.
   *
   * @param options Options for exporting the data of the OctKey.
   * @returns Resulting String.
   */
  public export(options: ExportOctKeyOptions<globalThis.BufferEncoding>): string;

  /**
   * Exports the data of the OctKey into a Buffer.
   *
   * @param options Options for exporting the data of the OctKey.
   * @returns Resulting Buffer.
   */
  public export(options: ExportOctKeyOptions<'buffer'>): Buffer;

  /**
   * Exports the data of the OctKey.
   *
   * @param options Options for exporting the data of the OctKey.
   * @returns Resulting Object.
   */
  public export<T extends ExportOctKeyEncoding>(options: ExportOctKeyOptions<T>): string | Buffer {
    const { encoding } = options;

    if (!SUPPORTED_OCTKEY_ENCODINGS.includes(encoding)) {
      throw new TypeError('Invalid option "encoding".');
    }

    const secret = this.cryptoKey.export();

    return encoding === 'buffer' ? secret : secret.toString(encoding);
  }
}
