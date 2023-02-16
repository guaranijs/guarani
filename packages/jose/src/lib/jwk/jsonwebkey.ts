import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { JoseException } from '../exceptions/jose.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../jwe/jsonwebencryption-keywrap-algorithm.type';
import { JsonWebSignatureAlgorithm } from '../jws/jsonwebsignature-algorithm.type';
import { EcKeyBackend } from './backends/ec/eckey.backend';
import { JsonWebKeyBackend } from './backends/jsonwebkey.backend';
import { OctKeyBackend } from './backends/oct/octkey.backend';
import { RsaKeyBackend } from './backends/rsa/rsakey.backend';
import { JsonWebKeyOperation } from './jsonwebkey-operation.type';
import { JsonWebKeyType } from './jsonwebkey-type.type';
import { JsonWebKeyUse } from './jsonwebkey-use.type';
import { JsonWebKeyParameters } from './jsonwebkey.parameters';

/**
 * Implementation of a JSON Web Key.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7517.html#section-4
 */
export class JsonWebKey<T extends JsonWebKeyParameters = JsonWebKeyParameters> implements JsonWebKeyParameters {
  /**
   * JSON Web Key Type.
   */
  public readonly kty!: JsonWebKeyType;

  /**
   * Indicates whether a Public JSON Web Key is used for Plaintext Encryption or Signature Verification.
   */
  public readonly use?: JsonWebKeyUse;

  /**
   * Operations for which the JSON Web Key are intended to be used.
   */
  public readonly key_ops?: JsonWebKeyOperation[];

  /**
   * JSON Web Encryption Key Wrap Algorithm or JSON Web Signature Algorithm allowed to use this JSON Web Key.
   */
  public readonly alg?: JsonWebEncryptionKeyWrapAlgorithm | JsonWebSignatureAlgorithm;

  /**
   * Identifier of the JSON Web Key.
   */
  public readonly kid?: string;

  /**
   * URL of the X.509 certificate of the JSON Web Key.
   */
  public readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key.
   */
  public readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public readonly 'x5t#S256'?: string;

  /**
   * Additional JSON Web Key Parameters.
   */
  [parameter: string]: unknown;

  /**
   * NodeJS Crypto Key.
   */
  public readonly cryptoKey!: KeyObject;

  /**
   * Supported JSON Web Key Backends.
   */
  private static readonly backends: Record<JsonWebKeyType, JsonWebKeyBackend> = {
    EC: new EcKeyBackend(),
    oct: new OctKeyBackend(),
    RSA: new RsaKeyBackend(),
  };

  /**
   * Instantiates a new JSON Web Key based on the provided Parameters.
   *
   * @param parameters Parameters of the JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public constructor(parameters: T, additionalParameters: Partial<T> = {}) {
    const params: T = { ...parameters, ...additionalParameters };

    if (!JsonWebKey.checkIsJsonWebKey(params)) {
      throw new InvalidJsonWebKeyException('The provided parameters do not represent a valid JSON Web Key.');
    }

    let algorithm: JsonWebKeyBackend;

    if ((algorithm = JsonWebKey.backends[params.kty]) === undefined) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Key Algorithm "${params.kty}".`);
    }

    JsonWebKey.validateParameters(params);

    Object.defineProperty(this, 'cryptoKey', { value: algorithm.load(params) });
    Object.assign(this, params);
  }

  /**
   * Checks if the provided JSON Web Key Parameters object is a valid Parameters object.
   *
   * @param parameters JSON Web Key Parameters object to be checked.
   */
  private static checkIsJsonWebKey(parameters: JsonWebKeyParameters): parameters is JsonWebKeyParameters {
    return Object.hasOwn(parameters, 'kty');
  }

  /**
   * Validates the provided JSON Web Key Parameters.
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  private static validateParameters(parameters: JsonWebKeyParameters): void {
    if (parameters.use !== undefined && typeof parameters.use !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "use".');
    }

    if (parameters.key_ops !== undefined) {
      if (
        !Array.isArray(parameters.key_ops) ||
        parameters.key_ops.length === 0 ||
        parameters.key_ops.some((keyOperation) => typeof keyOperation !== 'string')
      ) {
        throw new InvalidJsonWebKeyException('Invalid key parameter "key_ops".');
      }

      if (new Set(parameters.key_ops).size !== parameters.key_ops.length) {
        throw new InvalidJsonWebKeyException('Key parameter "key_ops" cannot have repeated operations.');
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
      throw new InvalidJsonWebKeyException('Invalid key parameter "alg".');
    }

    if (parameters.kid !== undefined && typeof parameters.kid !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "kid".');
    }

    if (parameters.x5u !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported key parameter "x5u".');
    }

    if (parameters.x5c !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported key parameter "x5c".');
    }

    if (parameters.x5t !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported key parameter "x5t".');
    }

    if (parameters['x5t#S256'] !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported key parameter "x5t#S256".');
    }
  }

  /**
   * Parses a JSON String into a JSON Web Key.
   *
   * @param data JSON String representation of the JSON Web Key to be parsed.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns Instance of a JSON Web Key based on the provided JSON String.
   */
  public static parse<T extends JsonWebKeyParameters>(
    data: string,
    additionalParameters: Partial<T> = {}
  ): JsonWebKey<T> {
    try {
      return new JsonWebKey<T>(JSON.parse(data), additionalParameters);
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
   * Returns the Parameters of the JSON Web Key.
   *
   * @param exportPublic Exports only the Public Parameters of the JSON Web Key.
   */
  public toJSON(exportPublic = true): T {
    if (!exportPublic) {
      return <T>Object.create(this);
    }

    const { privateParameters } = JsonWebKey.backends[this.kty];

    const publicParameters = Object.keys(this).filter((key) => !privateParameters.includes(key));

    return <T>Object.fromEntries(publicParameters.map((key: string) => [key, Reflect.get(this, key)]));
  }
}
