import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';

/**
 * Interface defining the supported parameters of a JsonWebKeySet.
 *
 * The parameters defined here are the default ones defined by
 * {@link https://tools.ietf.org/html/rfc7517 RFC 7517}.
 */
export interface JsonWebKeySetParams {
  /**
   * JSON Web Keys registered at the JSON Web Key Set.
   */
  readonly keys: JsonWebKeyParams[];
}
