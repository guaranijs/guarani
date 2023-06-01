import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { EllipticCurve } from '../elliptic-curve.type';
import { OctetKeyPairKeyParameters } from './octet-key-pair.key.parameters';

/**
 * Implementation of an Octet Key Pair JSON Web Key.
 *
 * @see https://www.rfc-editor.org/rfc/rfc8037.html#section-2
 */
export class OctetKeyPairKey extends JsonWebKey<OctetKeyPairKeyParameters> implements OctetKeyPairKeyParameters {
  /**
   * Octet Key Pair JSON Web Key Type.
   */
  public override readonly kty!: 'OKP';

  /**
   * Octet Key Pair Elliptic Curve Name.
   */
  public readonly crv!: Extract<EllipticCurve, 'Ed25519' | 'Ed448' | 'X25519' | 'X448'>;

  /**
   * Octet Key Pair Public Value.
   */
  public readonly x!: string;

  /**
   * Octet Key Pair Private Value.
   */
  public readonly d?: string;

  /**
   * Elliptic Curves supported by the Octet Key Pair JSON Web Key.
   */
  public get supportedEllipticCurves(): Extract<EllipticCurve, 'Ed25519' | 'Ed448' | 'X25519' | 'X448'>[] {
    return ['Ed25519', 'Ed448', 'X25519', 'X448'];
  }

  /**
   * Validates the provided Octet Key Pair JSON Web Key Parameters.
   *
   * @param parameters Parameters of the Octet Key Pair JSON Web Key.
   */
  protected override validateParameters(parameters: OctetKeyPairKeyParameters): void {
    if (parameters.kty !== 'OKP') {
      throw new TypeError(`Invalid jwk parameter "kty". Expected "OKP", got "${parameters.kty}".`);
    }

    if (typeof parameters.crv !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "crv".');
    }

    if (!this.supportedEllipticCurves.includes(parameters.crv)) {
      throw new UnsupportedEllipticCurveException('Invalid jwk parameter "crv".');
    }

    if (typeof parameters.x !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "x".');
    }

    if (typeof parameters.d !== 'undefined' && typeof parameters.d !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "d".');
    }

    super.validateParameters(parameters);
  }
}
