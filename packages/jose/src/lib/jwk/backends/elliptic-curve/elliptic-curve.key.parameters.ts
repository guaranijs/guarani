import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';
import { EllipticCurve } from '../elliptic-curve.type';

/**
 * Parameters of the Elliptic Curve JSON Web Key.
 */
export interface EllipticCurveKeyParameters extends JsonWebKeyParameters {
  /**
   * Elliptic Curve JSON Web Key Type.
   */
  readonly kty: 'EC';

  /**
   * Elliptic Curve Name.
   */
  readonly crv: Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>;

  /**
   * Elliptic Curve X Coordinate.
   */
  readonly x: string;

  /**
   * Elliptic Curve Y Coordinate.
   */
  readonly y: string;

  /**
   * Elliptic Curve Private Value.
   */
  readonly d?: string;
}
