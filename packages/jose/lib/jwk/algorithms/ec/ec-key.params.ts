import { Optional } from '@guarani/types';

import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { SupportedEllipticCurve } from './types/supported-elliptic-curve';

/**
 * Parameters of the Elliptic Curve JSON Web Key.
 */
export interface EcKeyParams extends JsonWebKeyParams {
  /**
   * Type of the JSON Web Key.
   */
  readonly kty: 'EC';

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
