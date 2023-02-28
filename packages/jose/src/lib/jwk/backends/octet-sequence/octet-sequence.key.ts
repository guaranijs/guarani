import { Buffer } from 'buffer';
import { createSecretKey, KeyObject } from 'crypto';

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
   * Parses the Parameters of the JSON Web Key into a NodeJS Crypto Key.
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  protected getCryptoKey(parameters: OctetSequenceKeyParameters): KeyObject {
    return createSecretKey(parameters.k, 'base64url');
  }

  /**
   * Returns the parameters used to calculate the Thumbprint of the JSON Web Key in lexicographic order.
   */
  protected getThumbprintParameters(): OctetSequenceKeyParameters {
    return { k: this.k, kty: this.kty };
  }

  /**
   * Returns a list with the private parameters of the JSON Web Key.
   */
  protected getPrivateParameters(): string[] {
    return [];
  }

  /**
   * Validates the provided Octet Sequence JSON Web Key Parameters.
   *
   * @param parameters Parameters of the Octet Sequence JSON Web Key.
   */
  protected override validateParameters(parameters: OctetSequenceKeyParameters): void {
    if (parameters.kty !== 'oct') {
      throw new TypeError(`Unexpected JSON Web Key Type "${parameters.kty}" for OctetSequenceKey.`);
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
