import { Buffer } from 'buffer';
import { createHash, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { JoseException } from '../exceptions/jose.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../jwe/jsonwebencryption-keywrap-algorithm.type';
import { JsonWebSignatureAlgorithm } from '../jws/jsonwebsignature-algorithm.type';
import type { EllipticCurveKey } from './backends/elliptic-curve/elliptic-curve.key';
import { EllipticCurveKeyParameters } from './backends/elliptic-curve/elliptic-curve.key.parameters';
import { GenerateEllipticCurveKeyOptions } from './backends/elliptic-curve/generate-elliptic-curve-key.options';
import { JSONWEBKEY_REGISTRY } from './backends/jsonwebkey.registry';
import { GenerateOctetKeyPairKeyOptions } from './backends/octet-key-pair/generate-octet-key-pair-key.options';
import type { OctetKeyPairKey } from './backends/octet-key-pair/octet-key-pair.key';
import { OctetKeyPairKeyParameters } from './backends/octet-key-pair/octet-key-pair.key.parameters';
import { GenerateOctetSequenceKeyOptions } from './backends/octet-sequence/generate-octet-sequence-key.options';
import type { OctetSequenceKey } from './backends/octet-sequence/octet-sequence.key';
import { OctetSequenceKeyParameters } from './backends/octet-sequence/octet-sequence.key.parameters';
import { GenerateRsaKeyOptions } from './backends/rsa/generate-rsa-key.options';
import type { RsaKey } from './backends/rsa/rsa.key';
import { RsaKeyParameters } from './backends/rsa/rsa.key.parameters';
import { JsonWebKeyOperation } from './jsonwebkey-operation.type';
import { JsonWebKeyType } from './jsonwebkey-type.type';
import { JsonWebKeyUse } from './jsonwebkey-use.type';
import { JsonWebKeyParameters } from './jsonwebkey.parameters';

/**
 * Abstract Base Class of a JSON Web Key.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7517.html#section-4
 */
export abstract class JsonWebKey<T extends JsonWebKeyParameters = JsonWebKeyParameters>
  implements JsonWebKeyParameters
{
  /**
   * JSON Web Key Type.
   */
  public abstract readonly kty: JsonWebKeyType;

  /**
   * Indicates whether a Public JSON Web Key is used for Plaintext Encryption or Signature Verification.
   */
  public use?: JsonWebKeyUse;

  /**
   * Operations for which the JSON Web Key are intended to be used.
   */
  public key_ops?: JsonWebKeyOperation[];

  /**
   * JSON Web Encryption Key Wrap Algorithm or JSON Web Signature Algorithm allowed to use this JSON Web Key.
   */
  public alg?: JsonWebEncryptionKeyWrapAlgorithm | JsonWebSignatureAlgorithm;

  /**
   * Identifier of the JSON Web Key.
   */
  public kid?: string;

  /**
   * URL of the X.509 certificate of the JSON Web Key.
   */
  public x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key.
   */
  public x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public 'x5t#S256'?: string;

  /**
   * Additional JSON Web Key Parameters.
   */
  [parameter: string]: any;

  /**
   * Thumbprint Buffer.
   */
  #thumbprint!: Buffer;

  /**
   * NodeJS Crypto Key.
   */
  readonly #cryptoKey!: KeyObject;

  /**
   * Thumbprint of the JSON Web Key according to **RFC 7638 JSON Web Key (JWK) Thumbprint**.
   *
   * The hash algorithm **SHA-256** is used to generate the thumbprint.
   *
   * @see https://www.rfc-editor.org/rfc/rfc7638.html
   */
  public get thumbprint(): Buffer {
    if (!Buffer.isBuffer(this._thumbprint)) {
      const parameters = this.getThumbprintParameters();
      this.#thumbprint = createHash('sha256').update(JSON.stringify(parameters), 'utf8').digest();
    }

    return this.#thumbprint;
  }

  /**
   * NodeJS Crypto Key.
   */
  public get cryptoKey(): KeyObject {
    return this.#cryptoKey;
  }

  /**
   * Instantiates a new JSON Web Key based on the provided Parameters.
   *
   * @param parameters Parameters of the JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public constructor(parameters: T, additionalParameters: Partial<T> = {}) {
    const params: T = { ...parameters, ...additionalParameters };

    this.validateParameters(params);

    Object.assign(this, params);

    this.#cryptoKey = this.getCryptoKey(params);
  }

  /**
   * Parses the Parameters of the JSON Web Key into a NodeJS Crypto Key.
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  protected abstract getCryptoKey(parameters: T): KeyObject;

  /**
   * Returns the parameters used to calculate the Thumbprint of the JSON Web Key in lexicographic order.
   */
  protected abstract getThumbprintParameters(): T;

  /**
   * Returns a list with the private parameters of the JSON Web Key.
   */
  protected abstract getPrivateParameters(): string[];

  /**
   * Validates the provided JSON Web Key Parameters.
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  protected validateParameters(parameters: T): void {
    if (parameters.use !== undefined && typeof parameters.use !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "use".');
    }

    if (parameters.key_ops !== undefined) {
      if (
        !Array.isArray(parameters.key_ops) ||
        parameters.key_ops.length === 0 ||
        parameters.key_ops.some((keyOperation) => typeof keyOperation !== 'string')
      ) {
        throw new InvalidJsonWebKeyException('Invalid jwk parameter "key_ops".');
      }

      if (new Set(parameters.key_ops).size !== parameters.key_ops.length) {
        throw new InvalidJsonWebKeyException('JWK parameter "key_ops" cannot have repeated operations.');
      }
    }

    if (parameters.use !== undefined && parameters.key_ops !== undefined) {
      const signatureOperations: JsonWebKeyOperation[] = ['sign', 'verify'];
      const encryptionOperations: JsonWebKeyOperation[] = [
        'encrypt',
        'decrypt',
        'wrapKey',
        'unwrapKey',
        'deriveKey',
        'deriveBits',
      ];

      if (
        (parameters.use === 'sig' &&
          parameters.key_ops.some((keyOperation) => !signatureOperations.includes(keyOperation))) ||
        (parameters.use === 'enc' &&
          parameters.key_ops.some((keyOperation) => !encryptionOperations.includes(keyOperation)))
      ) {
        throw new InvalidJsonWebKeyException('Invalid combination of "use" and "key_ops".');
      }
    }

    if (parameters.alg !== undefined && typeof parameters.alg !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "alg".');
    }

    if (parameters.kid !== undefined && typeof parameters.kid !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "kid".');
    }

    if (parameters.x5u !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported jwk parameter "x5u".');
    }

    if (parameters.x5c !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported jwk parameter "x5c".');
    }

    if (parameters.x5t !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported jwk parameter "x5t".');
    }

    if (parameters['x5t#S256'] !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported jwk parameter "x5t#S256".');
    }
  }

  /**
   * Parses a JSON Object into a JSON Web Key.
   *
   * @param data JSON Object representation of the JSON Web Key to be parsed.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns Instance of a JSON Web Key based on the provided JSON Object.
   */
  public static async load<T extends JsonWebKeyParameters>(
    data: unknown,
    additionalParameters: Partial<T> = {}
  ): Promise<JsonWebKey<T>> {
    if (data instanceof JsonWebKey<T>) {
      return data;
    }

    if (typeof data !== 'object' || data === null) {
      throw new InvalidJsonWebKeyException('The provided data is not a valid JSON Web Key object.');
    }

    if (!Object.hasOwn(data, 'kty')) {
      throw new InvalidJsonWebKeyException('The provided data does not have a "kty" parameter.');
    }

    const kty: JsonWebKeyType = Reflect.get(data, 'kty');

    if (!Object.hasOwn(JSONWEBKEY_REGISTRY, kty)) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Key Type "${kty}".`);
    }

    const backend = JSONWEBKEY_REGISTRY[kty];

    return (await backend.load(<T>data, additionalParameters)) as JsonWebKey<T>;
  }

  /**
   * Parses a JSON String into a JSON Web Key.
   *
   * @param data JSON String representation of the JSON Web Key to be parsed.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns Instance of a JSON Web Key based on the provided JSON String.
   */
  public static async parse<T extends JsonWebKeyParameters>(
    data: string,
    additionalParameters: Partial<T> = {}
  ): Promise<JsonWebKey<T>> {
    try {
      return await this.load<T>(JSON.parse(data), additionalParameters);
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const joseException = new InvalidJsonWebKeyException();
      joseException.cause = exc;

      throw joseException;
    }
  }

  /**
   * Generates a new Elliptic Curve JSON Web Key on the fly based on the provided options.
   *
   * @param keyType Elliptic Curve JSON Web Key Type.
   * @param options Options used to generate the Elliptic Curve JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public static async generate(
    keyType: 'EC',
    options: GenerateEllipticCurveKeyOptions,
    additionalParameters?: Partial<EllipticCurveKeyParameters>
  ): Promise<EllipticCurveKey>;

  /**
   * Generates a new Octet Key Pair JSON Web Key on the fly based on the provided options.
   *
   * @param keyType Octet Key Pair JSON Web Key Type.
   * @param options Options used to generate the Octet Key Pair JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public static async generate(
    keyType: 'OKP',
    options: GenerateOctetKeyPairKeyOptions,
    additionalParameters?: Partial<OctetKeyPairKeyParameters>
  ): Promise<OctetKeyPairKey>;

  /**
   * Generates a new RSA JSON Web Key on the fly based on the provided options.
   *
   * @param keyType RSA JSON Web Key Type.
   * @param options Options used to generate the RSA JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public static async generate(
    keyType: 'RSA',
    options: GenerateRsaKeyOptions,
    additionalParameters?: Partial<RsaKeyParameters>
  ): Promise<RsaKey>;

  /**
   * Generates a new Octet Sequence JSON Web Key on the fly based on the provided options.
   *
   * @param keyType Octet Sequence JSON Web Key Type.
   * @param options Options used to generate the Octet Sequence JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public static async generate(
    keyType: 'oct',
    options: GenerateOctetSequenceKeyOptions,
    additionalParameters?: Partial<OctetSequenceKeyParameters>
  ): Promise<OctetSequenceKey>;

  /**
   * Generates a new JSON Web Key on the fly based on the provided options.
   *
   * @param keyType JSON Web Key Type.
   * @param options Options used to generate the JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public static async generate<T extends JsonWebKeyParameters>(
    keyType: JsonWebKeyType,
    options: Record<string, any>,
    additionalParameters: Partial<T> = {}
  ): Promise<JsonWebKey<T>> {
    if (!Object.hasOwn(JSONWEBKEY_REGISTRY, keyType)) {
      throw new TypeError(`Unsupported JSON Web Key Type "${keyType}".`);
    }

    const backend = JSONWEBKEY_REGISTRY[keyType];

    return (await backend.generate(options, additionalParameters)) as JsonWebKey<T>;
  }

  /**
   * Returns the Parameters of the JSON Web Key.
   *
   * @param exportPublic Exports only the Public Parameters of the JSON Web Key. (defaults to true)
   */
  public toJSON(exportPublic = true): T {
    const privateParameters: string[] = this.getPrivateParameters();

    let entries = Object.entries(this);

    if (exportPublic) {
      entries = entries.filter(([parameter]) => !privateParameters.includes(parameter));
    }

    const parameters = <T>Object.fromEntries(entries);

    return parameters;
  }
}
