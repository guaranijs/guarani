import { JsonWebKeyParams } from '../../jsonwebkey.params';

/**
 * Parameters of the Octet Key.
 */
export interface OctKeyParams extends JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty: 'oct';

  /**
   * Base64Url encoded Octet.
   */
  readonly k: string;
}
