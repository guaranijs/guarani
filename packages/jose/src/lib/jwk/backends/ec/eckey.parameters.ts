import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';
import { EllipticCurve } from './elliptic-curve.enum';

/**
 * Parameters of the Elliptic Curve JSON Web Key.
 */
export interface EcKeyParameters extends JsonWebKeyParameters {
  /**
   * Elliptic Curve Name.
   */
  readonly crv: EllipticCurve;

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
