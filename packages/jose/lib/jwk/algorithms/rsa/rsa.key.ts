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
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { RsaKeyParams } from './rsa-key.params';
import { ExportRsaKeyEncoding } from './types/export-rsa-key-encoding';
import { ExportRsaKeyFormat } from './types/export-rsa-key-format';
import { ExportRsaKeyType } from './types/export-rsa-key-type';
import { ExportRsaKeyOptions } from './types/export-rsa-key.options';
import { GenerateRsaKeyOptions } from './types/generate-rsa-key.options';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7518.html#section-6.3 RFC 7518 Section 6.3}.
 */
export class RsaKey extends JsonWebKey implements RsaKeyParams {
  /**
   * Type of the JSON Web Key.
   */
  public readonly kty!: 'RSA';

  /**
   * Modulus.
   */
  public readonly n!: string;

  /**
   * Public Exponent.
   */
  public readonly e!: string;

  /**
   * Private Exponent.
   */
  public readonly d?: Optional<string>;

  /**
   * First Prime Factor.
   */
  public readonly p?: Optional<string>;

  /**
   * Second Prime Factor.
   */
  public readonly q?: Optional<string>;

  /**
   * First Factor CRT Exponent.
   */
  public readonly dp?: Optional<string>;

  /**
   * Second Factor CRT Exponent.
   */
  public readonly dq?: Optional<string>;

  /**
   * First Factor CRT Coefficient.
   */
  public readonly qi?: Optional<string>;

  /**
   * Instantiates an RSA JSON Web Key based on the provided Parameters.
   *
   * @param key Parameters of the RSA JSON Web Key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: RsaKeyParams, options: Optional<JsonWebKeyParams> = {}) {
    if (key instanceof RsaKey) {
      return key;
    }

    const params = <RsaKeyParams>{ ...key, ...options };

    if (typeof params.kty !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "kty".');
    }

    if (params.kty !== 'RSA') {
      throw new UnsupportedAlgorithmException(`Invalid JSON Web Key Type. Expected "RSA", got "${params.kty}".`);
    }

    if (typeof params.n !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "n".');
    }

    if (Buffer.from(params.n, 'base64url').length < 256) {
      throw new InvalidJsonWebKeyException('The modulus MUST have AT LEAST 2048 bits.');
    }

    if (typeof params.e !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "e".');
    }

    // TODO: Validate the following values based on the previous ones.
    if (['d', 'p', 'q', 'dp', 'dq', 'qi'].some((param) => params[param] !== undefined)) {
      if (typeof params.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "d".');
      }

      if (typeof params.p !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "p".');
      }

      if (typeof params.q !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "q".');
      }

      if (typeof params.dp !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "dp".');
      }

      if (typeof params.dq !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "dq".');
      }

      if (typeof params.qi !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "qi".');
      }
    }

    super(params);
  }

  /**
   * Generates a new RSA JSON Web Key.
   *
   * @param options Options for the generation of the RSA JSON Web Key.
   * @param params Optional JSON Web Key Parameters.
   * @returns Generated RSA JSON Web Key.
   */
  public static async generate(
    options: GenerateRsaKeyOptions,
    params: Optional<JsonWebKeyParams> = {}
  ): Promise<RsaKey> {
    const { modulus, publicExponent } = options;

    if (!Number.isInteger(modulus)) {
      throw new TypeError('Invalid parameter "modulus".');
    }

    if (modulus < 2048) {
      throw new Error('The modulus must be at least 2048 bits.');
    }

    if (publicExponent !== undefined && !Number.isInteger(publicExponent)) {
      throw new TypeError('Invalid parameter "publicExponent".');
    }

    const { privateKey } = await generateKeyPairAsync('rsa', { modulusLength: modulus, publicExponent });

    return new RsaKey(<RsaKeyParams>privateKey.export({ format: 'jwk' }), params);
  }

  /**
   * Loads the provided JSON Web Key into a NodeJS Crypto Key.
   *
   * @param params Parameters of the JSON Web Key.
   * @returns NodeJS Crypto Key.
   */
  protected loadCryptoKey(params: RsaKeyParams): KeyObject {
    const input: CryptoJsonWebKeyInput = { format: 'jwk', key: params };
    return params.d === undefined ? createPublicKey(input) : createPrivateKey(input);
  }

  /**
   * Exports the PKCS#1 RSA Private Key DER Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns DER Encoded PKCS#1 RSA Private Key.
   */
  public export(options: ExportRsaKeyOptions<'der', 'pkcs1', 'private'>): Buffer;

  /**
   * Exports the PKCS#1 RSA Private Key PEM Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns PEM Encoded PKCS#1 RSA Private Key.
   */
  public export(options: ExportRsaKeyOptions<'pem', 'pkcs1', 'private'>): string;

  /**
   * Exports the PKCS#8 RSA Private Key DER Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns DER Encoded PKCS#8 RSA Private Key.
   */
  public export(options: ExportRsaKeyOptions<'der', 'pkcs8', 'private'>): Buffer;

  /**
   * Exports the PKCS#8 RSA Private Key PEM Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns PEM Encoded PKCS#8 RSA Private Key.
   */
  public export(options: ExportRsaKeyOptions<'pem', 'pkcs8', 'private'>): string;

  /**
   * Exports the PKCS#1 RSA Public Key DER Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns DER Encoded PKCS#1 RSA Public Key.
   */
  public export(options: ExportRsaKeyOptions<'der', 'pkcs1', 'public'>): Buffer;

  /**
   * Exports the PKCS#1 RSA Public Key PEM Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns PEM Encoded PKCS#1 RSA Public Key.
   */
  public export(options: ExportRsaKeyOptions<'pem', 'pkcs1', 'public'>): string;

  /**
   * Exports the SPKI RSA Public Key DER Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns DER Encoded SPKI RSA Public Key.
   */
  public export(options: ExportRsaKeyOptions<'der', 'spki', 'public'>): Buffer;

  /**
   * Exports the SPKI RSA Public Key PEM Encoding of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns PEM Encoded SPKI RSA Public Key.
   */
  public export(options: ExportRsaKeyOptions<'pem', 'spki', 'public'>): string;

  /**
   * Exports the data of the RSA JSON Web Key.
   *
   * @param options Options for exporting the data of the RSA JSON Web Key.
   * @returns Encoded data of the RSA JSON Web Key.
   */
  public export<E extends ExportRsaKeyEncoding, F extends ExportRsaKeyFormat, T extends ExportRsaKeyType>(
    options: ExportRsaKeyOptions<E, F, T>
  ): string | Buffer {
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
      throw new TypeError(`Unsupported format "${format}" for type "${type}".`);
    }

    if (type === 'public' && format !== 'pkcs1' && format !== 'spki') {
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
