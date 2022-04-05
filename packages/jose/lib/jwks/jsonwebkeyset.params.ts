import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';

/**
 * Parameters of the JSON Web Key Set.
 */
export interface JsonWebKeySetParams {
  /**
   * JSON Web Keys registered at the JSON Web Key Set.
   */
  readonly keys: JsonWebKeyParams[];
}
