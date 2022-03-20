import { JsonWebKeyParams } from '../../jsonwebkey.params';

/**
 * Parameters of the Octet Sequence JSON Web Key.
 */
export interface OctKeyParams extends JsonWebKeyParams {
  /**
   * Type of the JSON Web Key.
   */
  readonly kty: 'oct';

  /**
   * Base64Url encoded Octet.
   */
  readonly k: string;
}
