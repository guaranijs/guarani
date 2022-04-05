import { removeNullishValues } from '@guarani/objects';
import { Optional } from '@guarani/types';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';
import { JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY } from './algorithms/jsonwebsignature-algorithms-registry';
import { SupportedJsonWebSignatureAlgorithm } from './algorithms/types/supported-jsonwebsignature-algorithm';
import { JsonWebSignatureHeaderParams } from './jsonwebsignature-header.params';

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7515.html#section-4 RFC 7515 Section 4}.
 */
export class JsonWebSignatureHeader implements JsonWebSignatureHeaderParams {
  /**
   * JSON Web Signature Algorithm used to Sign and Verify the Token.
   */
  public readonly alg!: SupportedJsonWebSignatureAlgorithm;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Sign the Token.
   */
  public readonly jku?: Optional<string>;

  /**
   * JSON Web Key used to Sign the Token.
   */
  public readonly jwk?: Optional<JsonWebKeyParams>;

  /**
   * Identifier of the JSON Web Key used to Sign the Token.
   */
  public readonly kid?: Optional<string>;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public readonly x5u?: Optional<string>;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Sign the Token.
   */
  public readonly x5c?: Optional<string[]>;

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public readonly x5t?: Optional<string>;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public readonly 'x5t#S256'?: Optional<string>;

  /**
   * Defines the type of the Token.
   */
  public readonly typ?: Optional<string>;

  /**
   * Defines the type of the Payload of the Token.
   */
  public readonly cty?: Optional<string>;

  /**
   * Defines the parameters that MUST be present in the JOSE Header.
   */
  public readonly crit?: Optional<string[]>;

  /**
   * Instantiates a JSON Web Signature Header for Compact Serialization.
   *
   * @param params Parameters of the JSON Web Signature Header.
   */
  public constructor(params: JsonWebSignatureHeaderParams) {
    if (params instanceof JsonWebSignatureHeader) {
      return params;
    }

    if (typeof params.alg !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "alg".');
    }

    if (JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY[params.alg] === undefined) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Signature Algorithm "${params.alg}".`);
    }

    if (params.jku !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "jku".');
    }

    if (params.jwk !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "jwk".');
    }

    if (params.kid !== undefined && typeof params.kid !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "kid".');
    }

    if (params.x5u !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5u".');
    }

    if (params.x5c !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5c".');
    }

    if (params.x5t !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5t".');
    }

    if (params['x5t#S256'] !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5t#S256".');
    }

    if (params.crit !== undefined) {
      if (!Array.isArray(params.crit) || params.crit.length === 0) {
        throw new InvalidJoseHeaderException('Invalid parameter "crit".');
      }

      if (params.crit.some((criticalParam) => typeof criticalParam !== 'string' || criticalParam.length === 0)) {
        throw new InvalidJoseHeaderException('Invalid parameter "crit".');
      }

      params.crit.forEach((criticalParam) => {
        if (params[criticalParam] === undefined) {
          throw new InvalidJoseHeaderException(`Missing required parameter "${criticalParam}".`);
        }
      });
    }

    Object.assign<JsonWebSignatureHeader, JsonWebSignatureHeaderParams>(this, removeNullishValues(params));
  }

  /**
   * Checks if the provided object conforms to the JSON Web Signature Header Specification.
   *
   * @param data Object to be inspected.
   */
  public static isJsonWebSignatureHeader(data: unknown): data is JsonWebSignatureHeaderParams {
    const algs = Object.keys(JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY);

    const hasAlg = algs.includes((<JsonWebSignatureHeaderParams>data).alg);

    return hasAlg;
  }
}
