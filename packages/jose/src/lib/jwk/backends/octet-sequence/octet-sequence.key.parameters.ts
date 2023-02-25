import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';

/**
 * Parameters of the Octet Sequence JSON Web Key.
 */
export interface OctetSequenceKeyParameters extends JsonWebKeyParameters {
  /**
   * Octet Sequence JSON Web Key Type.
   */
  readonly kty: 'oct';

  /**
   * Base64Url encoded Octet Sequence Secret.
   */
  readonly k: string;
}
