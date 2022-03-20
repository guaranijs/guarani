import { Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';

/**
 * Representation of the parameters of an **oct** Symmetric Key.
 */
export interface OctKeyParams extends JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty?: Optional<'oct'>;

  /**
   * Base64Url string representation of the secret.
   */
  readonly k: string;
}

/**
 * Implementation of the **oct** Symmetric Key.
 *
 * In this implementation, the same secret is used to perform
 * all of the operations.
 *
 * It is **NOT RECOMMENDED** to disclose this type of key in a
 * **JSON Web Keyset (JWKS)**, since it can lead to security issues.
 */
export class OctKey extends JsonWebKey implements OctKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty: 'oct' = 'oct';

  /**
   * Base64Url string representation of the secret.
   */
  public readonly k!: string;

  /**
   * Instantiates an OctKey based on the provided parameters.
   *
   * @param key Parameters of the key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: OctKeyParams, options: Optional<JsonWebKeyParams> = {}) {
    const params = <OctKeyParams>{ ...key, ...options };

    if (params.kty !== undefined && params.kty !== 'oct') {
      throw new InvalidJsonWebKeyException(`Invalid key parameter "kty". Expected "oct", got "${params.kty}".`);
    }

    if (typeof params.k !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "k".');
    }

    if (params.k.length < 1) {
      throw new InvalidJsonWebKeyException('Invalid secret size.');
    }

    super(params);
  }
}
