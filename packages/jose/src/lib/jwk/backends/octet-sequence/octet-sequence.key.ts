import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { OctetSequenceKeyParameters } from './octet-sequence.key.parameters';

/**
 * Implementation of an Octet Sequence JSON Web Key.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-6.4
 */
export class OctetSequenceKey extends JsonWebKey<OctetSequenceKeyParameters> implements OctetSequenceKeyParameters {
  /**
   * JSON Web Key Type.
   */
  public override readonly kty!: 'oct';

  /**
   * Base64Url encoded Octet Sequence Secret.
   */
  public readonly k!: string;

  /**
   * Validates the provided Octet Sequence JSON Web Key Parameters.
   *
   * @param parameters Parameters of the Octet Sequence JSON Web Key.
   */
  protected override validateParameters(parameters: OctetSequenceKeyParameters): void {
    if (parameters.kty !== 'oct') {
      throw new TypeError(`Invalid jwk parameter "kty". Expected "oct", got "${parameters.kty}".`);
    }

    if (typeof parameters.k !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "k".');
    }

    if (Buffer.byteLength(parameters.k, 'base64url') === 0) {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "k".');
    }

    super.validateParameters(parameters);
  }
}
