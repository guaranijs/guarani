import { Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';

/**
 * Representation of the parameters of an **RSA** Asymmetric Key.
 */
export interface RsaKeyParams extends JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty: 'RSA';

  /**
   * Base64Url representation of the Modulus.
   */
  readonly n: string;

  /**
   * Base64Url representation of the Public Exponent.
   */
  readonly e: string;

  /**
   * Base64Url representation of the Private Exponent.
   */
  readonly d?: Optional<string>;

  /**
   * Base64Url representation of the First Prime.
   */
  readonly p?: Optional<string>;

  /**
   * Base64Url representation of the Second Prime.
   */
  readonly q?: Optional<string>;

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  readonly dp?: Optional<string>;

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  readonly dq?: Optional<string>;

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  readonly qi?: Optional<string>;

  /**
   * Base64Url representation of the Other Primes.
   */
  readonly oth?: Optional<[Optional<string>?, Optional<string>?, Optional<string>?]>;
}

/**
 * Implementation of the **RSA** Asymmetric Key.
 */
export class RsaKey extends JsonWebKey implements RsaKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty: 'RSA' = 'RSA';

  /**
   * Base64Url representation of the Modulus.
   */
  public readonly n!: string;

  /**
   * Base64Url representation of the Public Exponent.
   */
  public readonly e!: string;

  /**
   * Base64Url representation of the Private Exponent.
   */
  public readonly d?: Optional<string>;

  /**
   * Base64Url representation of the First Prime.
   */
  public readonly p?: Optional<string>;

  /**
   * Base64Url representation of the Second Prime.
   */
  public readonly q?: Optional<string>;

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  public readonly dp?: Optional<string>;

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  public readonly dq?: Optional<string>;

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  public readonly qi?: Optional<string>;

  /**
   * Base64Url representation of the Other Primes.
   */
  public readonly oth?: Optional<[Optional<string>?, Optional<string>?, Optional<string>?]>;

  /**
   * Instantiantes a new RSA Key based on the provided parameters.
   *
   * @param key Parameters of the key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: RsaKeyParams, options: Optional<JsonWebKeyParams> = {}) {
    const params = <RsaKeyParams>{ ...key, ...options };

    if (params.kty !== undefined && params.kty !== 'RSA') {
      throw new InvalidJsonWebKeyException(`Invalid key parameter "kty". Expected "RSA", got "${params.kty}".`);
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
    if (params.d !== undefined) {
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
}
