import { removeNullishValues } from '@guarani/objects';
import { Dict, Optional } from '@guarani/types';

import { KeyObject } from 'crypto';
import { inspect } from 'util';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-json-web-key.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { EcKey } from '../jwa/jwk/ec/ec.key';
import { ExportEcKeyOptions, GenerateEcKeyOptions } from '../jwa/jwk/ec/types';
import { JsonWebKeyAlgorithm } from '../jwa/jwk/jsonwebkey.algorithm';
import { OctKey } from '../jwa/jwk/oct/oct.key';
import { ExportOctKeyOptions, GenerateOctKeyOptions } from '../jwa/jwk/oct/types';
import { RsaKey } from '../jwa/jwk/rsa/rsa.key';
import { ExportRsaKeyOptions, GenerateRsaKeyOptions } from '../jwa/jwk/rsa/types';
import { JsonWebKeyOptions } from './jsonwebkey.options';
import { JsonWebKeyParams } from './jsonwebkey.params';

export class JsonWebKey {
  private static readonly JWK_ALGORITHMS: Dict<JsonWebKeyAlgorithm> = {
    EC: new EcKey(),
    RSA: new RsaKey(),
    oct: new OctKey(),
  };

  /**
   * NodeJS Key represented by the JSON Web Key.
   */
  private readonly cryptoKey!: KeyObject;

  /**
   * Parameters of the JSON Web Key.
   */
  private readonly key!: JsonWebKeyParams;

  /**
   * Instantiates a new JSON Web Key based on the provided parameters.
   *
   * @param jwk Parameters of the JSON Web Key.
   * @param options Optional JSON Web Key Parameters to customize the JSON Web Key.
   */
  public constructor(jwk: JsonWebKeyParams, options: Optional<JsonWebKeyOptions> = {}) {
    const params = <JsonWebKeyParams>{ ...jwk, ...options };

    this.validateJwkParams(params);
    this.loadCryptoKey(jwk);

    Object.defineProperty(this, 'key', { enumerable: false, value: removeNullishValues(params) });
  }

  /**
   * Generates a new Elliptic Curve JSON Web Key.
   *
   * @param options JSON Web Key Elliptic Curve generation options.
   * @param jwkOptions Optional JSON Web Key Parameters.
   */
  public static async generate(
    options: GenerateEcKeyOptions,
    jwkOptions?: Optional<JsonWebKeyParams>
  ): Promise<JsonWebKey>;

  /**
   * Generates a new Octet JSON Web Key.
   *
   * @param options JSON Web Key Octet generation options.
   * @param jwkOptions Optional JSON Web Key Parameters.
   */
  public static async generate(
    options: GenerateOctKeyOptions,
    jwkOptions?: Optional<JsonWebKeyParams>
  ): Promise<JsonWebKey>;

  /**
   * Generates a new RSA JSON Web Key.
   *
   * @param options JSON Web Key RSA generation options.
   * @param jwkOptions Optional JSON Web Key Parameters.
   */
  public static async generate(
    options: GenerateRsaKeyOptions,
    jwkOptions?: Optional<JsonWebKeyParams>
  ): Promise<JsonWebKey>;

  /**
   * Generates a new JSON Web Key.
   *
   * @param options JSON Web Key generation options.
   * @param jwkOptions Optional JSON Web Key Parameters.
   */
  public static async generate(
    options: GenerateEcKeyOptions | GenerateOctKeyOptions | GenerateRsaKeyOptions,
    jwkOptions: Optional<JsonWebKeyParams>
  ): Promise<JsonWebKey> {
    const algorithm = JsonWebKey.JWK_ALGORITHMS[options.kty];

    if (algorithm === undefined) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Key Algorithm "${options.kty}".`);
    }

    const key = await algorithm.generate(options);

    return new JsonWebKey(key.export({ format: 'jwk' }), jwkOptions);
  }

  /**
   * Returns the SEC 1 Elliptic Curve Private Key DER Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns DER Encoded SEC 1 Elliptic Curve Private Key.
   */
  public async export(options: ExportEcKeyOptions<'der', 'sec1', 'private'>): Promise<Buffer>;

  /**
   * Returns the SEC 1 Elliptic Curve Private Key PEM Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns PEM Encoded SEC 1 Elliptic Curve Private Key.
   */
  public async export(options: ExportEcKeyOptions<'pem', 'sec1', 'private'>): Promise<string>;

  /**
   * Returns the PKCS#8 Elliptic Curve Private Key DER Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns DER Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public async export(options: ExportEcKeyOptions<'der', 'pkcs8', 'private'>): Promise<Buffer>;

  /**
   * Returns the PKCS#8 Elliptic Curve Private Key PEM Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns PEM Encoded PKCS#8 Elliptic Curve Private Key.
   */
  public async export(options: ExportEcKeyOptions<'pem', 'pkcs8', 'private'>): Promise<string>;

  /**
   * Returns the SPKI Elliptic Curve Public Key DER Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns DER Encoded SPKI Elliptic Curve Public Key.
   */
  public async export(options: ExportEcKeyOptions<'der', 'spki', 'public'>): Promise<Buffer>;

  /**
   * Returns the SPKI Elliptic Curve Public Key PEM Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns PEM Encoded SPKI Elliptic Curve Public Key.
   */
  public async export(options: ExportEcKeyOptions<'pem', 'spki', 'public'>): Promise<string>;

  /**
   * Exports the Octet JSON Web Key into a Base64 Encoded String.
   *
   * @param options Parameters for exporing the JSON Web Key.
   * @returns Resulting Base64 Encoded String.
   */
  public async export(options: ExportOctKeyOptions<'base64'>): Promise<string>;

  /**
   * Exports the Octet JSON Web Key into a Buffer.
   *
   * @param options Parameters for exporing the JSON Web Key.
   * @returns Resulting Buffer.
   */
  public async export(options: ExportOctKeyOptions<'buffer'>): Promise<Buffer>;

  /**
   * Returns the PKCS#1 RSA Private Key DER Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns DER Encoded PKCS#1 RSA Private Key.
   */
  public async export(options: ExportRsaKeyOptions<'der', 'pkcs1', 'private'>): Promise<Buffer>;

  /**
   * Returns the PKCS#1 RSA Private Key PEM Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns PEM Encoded PKCS#1 RSA Private Key.
   */
  public async export(options: ExportRsaKeyOptions<'pem', 'pkcs1', 'private'>): Promise<string>;

  /**
   * Returns the PKCS#8 RSA Private Key DER Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns DER Encoded PKCS#8 RSA Private Key.
   */
  public async export(options: ExportRsaKeyOptions<'der', 'pkcs8', 'private'>): Promise<Buffer>;

  /**
   * Returns the PKCS#8 RSA Private Key PEM Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns PEM Encoded PKCS#8 RSA Private Key.
   */
  public async export(options: ExportRsaKeyOptions<'pem', 'pkcs8', 'private'>): Promise<string>;

  /**
   * Returns the PKCS#1 RSA Public Key DER Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns DER Encoded PKCS#1 RSA Public Key.
   */
  public async export(options: ExportRsaKeyOptions<'der', 'pkcs1', 'public'>): Promise<Buffer>;

  /**
   * Returns the PKCS#1 RSA Public Key PEM Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns PEM Encoded PKCS#1 RSA Public Key.
   */
  public async export(options: ExportRsaKeyOptions<'pem', 'pkcs1', 'public'>): Promise<string>;

  /**
   * Returns the SPKI RSA Public Key DER Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns DER Encoded SPKI RSA Public Key.
   */
  public async export(options: ExportRsaKeyOptions<'der', 'spki', 'public'>): Promise<Buffer>;

  /**
   * Returns the SPKI RSA Public Key PEM Encoding of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns PEM Encoded SPKI RSA Public Key.
   */
  public async export(options: ExportRsaKeyOptions<'pem', 'spki', 'public'>): Promise<string>;

  /**
   * Encodes and exports the parameters of the JSON Web Key.
   *
   * @param options Parameters for exporting the JSON Web Key.
   * @returns Encoded JSON Web Key.
   */
  public async export(
    options:
      | ExportEcKeyOptions<'der', 'sec1', 'private'>
      | ExportEcKeyOptions<'pem', 'sec1', 'private'>
      | ExportEcKeyOptions<'der', 'pkcs8', 'private'>
      | ExportEcKeyOptions<'pem', 'pkcs8', 'private'>
      | ExportEcKeyOptions<'der', 'spki', 'public'>
      | ExportEcKeyOptions<'pem', 'spki', 'public'>
      | ExportOctKeyOptions<'base64'>
      | ExportOctKeyOptions<'buffer'>
      | ExportRsaKeyOptions<'der', 'pkcs1', 'private'>
      | ExportRsaKeyOptions<'pem', 'pkcs1', 'private'>
      | ExportRsaKeyOptions<'der', 'pkcs8', 'private'>
      | ExportRsaKeyOptions<'pem', 'pkcs8', 'private'>
      | ExportRsaKeyOptions<'der', 'pkcs1', 'public'>
      | ExportRsaKeyOptions<'pem', 'pkcs1', 'public'>
      | ExportRsaKeyOptions<'der', 'spki', 'public'>
      | ExportRsaKeyOptions<'pem', 'spki', 'public'>
  ): Promise<string | Buffer> {
    const algorithm = JsonWebKey.JWK_ALGORITHMS[this.key.kty];
    return await algorithm.export(this.cryptoKey, options);
  }

  /**
   * Parameters of the JSON Web Key.
   */
  public toJSON(): JsonWebKeyParams {
    return this.key;
  }

  /**
   * Representation of the JSON Web Key.
   */
  public [inspect.custom](): JsonWebKeyParams {
    return this.toJSON();
  }

  /**
   * Validates the provided JSON Web Key Parameters.
   *
   * @param params Parameters of the provided JSON Web Key and its options.
   */
  private validateJwkParams(params: JsonWebKeyParams): void {
    if (typeof params.kty !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "kty".');
    }

    if (params.use !== undefined && typeof params.use !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "use".');
    }

    if (params.key_ops !== undefined) {
      if (!Array.isArray(params.key_ops) || params.key_ops.some((p) => typeof p !== 'string')) {
        throw new InvalidJsonWebKeyException('Invalid parameter "key_ops".');
      }

      if (new Set(params.key_ops).size !== params.key_ops.length) {
        throw new InvalidJsonWebKeyException('Parameter "key_ops" cannot have repeated operations.');
      }
    }

    if (params.use !== undefined && params.key_ops !== undefined) {
      const sig = ['sign', 'verify'];
      const enc = ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey', 'deriveKey', 'deriveBits'];

      if (
        (params.use === 'sig' && params.key_ops.some((p) => !sig.includes(p))) ||
        (params.use === 'enc' && params.key_ops.some((p) => !enc.includes(p)))
      ) {
        throw new InvalidJsonWebKeyException('Invalid combination of "use" and "key_ops".');
      }
    }

    if (params.alg !== undefined && typeof params.alg !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "alg".');
    }

    if (params.kid !== undefined && typeof params.kid !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "kid".');
    }

    if (params.x5u !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5u".');
    }

    if (params.x5c !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5c".');
    }

    if (params.x5t !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5t".');
    }

    if (params['x5t#S256'] !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5t#256".');
    }
  }

  /**
   * Loads a NodeJS Crypto Key based on the provided JSON Web Key.
   *
   * @param jwk JSON Web Key provided by the application.
   */
  private loadCryptoKey(jwk: JsonWebKeyParams): void {
    const algorithm = JsonWebKey.JWK_ALGORITHMS[jwk.kty];

    if (algorithm === undefined) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Key Algorithm "${jwk.kty}".`);
    }

    const cryptoKey = algorithm.load(jwk);

    Object.defineProperty(this, 'cryptoKey', { enumerable: false, value: cryptoKey });
  }
}
