import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { EllipticCurve } from '../elliptic-curve.type';
import { EllipticCurveKeyParameters } from './elliptic-curve.key.parameters';

/**
 * Implementation of an Elliptic Curve JSON Web Key.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-6.2
 */
export class EllipticCurveKey extends JsonWebKey<EllipticCurveKeyParameters> implements EllipticCurveKeyParameters {
  /**
   * Elliptic Curve JSON Web Key Type.
   */
  public override readonly kty!: 'EC';

  /**
   * Elliptic Curve Name.
   */
  public readonly crv!: Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>;

  /**
   * Elliptic Curve X Coordinate.
   */
  public readonly x!: string;

  /**
   * Elliptic Curve Y Coordinate.
   */
  public readonly y!: string;

  /**
   * Elliptic Curve Private Value.
   */
  public readonly d?: string;

  /**
   * Elliptic Curves supported by the Elliptic Curve JSON Web Key.
   */
  public get supportedEllipticCurves(): Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>[] {
    return ['P-256', 'P-384', 'P-521'];
  }

  /**
   * Validates the provided Elliptic Curve JSON Web Key Parameters.
   *
   * @param parameters Parameters of the Elliptic Curve JSON Web Key.
   */
  protected override validateParameters(parameters: EllipticCurveKeyParameters): void {
    if (parameters.kty !== 'EC') {
      throw new TypeError(`Invalid jwk parameter "kty". Expected "EC", got "${parameters.kty}".`);
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

    if (typeof parameters.y !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "y".');
    }

    if (typeof parameters.d !== 'undefined' && typeof parameters.d !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid jwk parameter "d".');
    }

    super.validateParameters(parameters);
  }
}
