import { JsonWebKeyParams } from '../../jsonwebkey.params';

/**
 * Parameters of the Octet Key.
 */
export interface OctKeyParams extends JsonWebKeyParams<'oct'> {
  /**
   * Base64Url encoded Octet.
   */
  readonly k: string;
}
