import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';

/**
 * Parameters of the Octet Sequence JSON Web Key.
 */
export interface OctKeyParameters extends JsonWebKeyParameters {
  /**
   * Base64Url encoded Octet Sequence Secret.
   */
  readonly k: string;
}
