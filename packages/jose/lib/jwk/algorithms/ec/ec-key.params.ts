import { Optional } from '@guarani/types';
import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { SupportedEllipticCurve } from './supported-elliptic-curve';

/**
 * Parameters of the Elliptic Curve Key.
 */
export interface EcKeyParams extends JsonWebKeyParams<'EC'> {
  /**
   * Name of the Elliptic Curve.
   */
  readonly crv: SupportedEllipticCurve;

  /**
   * X Coordinate.
   */
  readonly x: string;

  /**
   * Y Coordinate.
   */
  readonly y: string;

  /**
   * Private Key.
   */
  readonly d?: Optional<string>;
}
