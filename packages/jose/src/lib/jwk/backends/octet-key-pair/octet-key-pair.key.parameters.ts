import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';
import { EllipticCurve } from '../elliptic-curve.type';

/**
 * Parameters of the Octet Key Pair JSON Web Key.
 */
export interface OctetKeyPairKeyParameters extends JsonWebKeyParameters {
  /**
   * Octet Key Pair JSON Web Key Type.
   */
  readonly kty: 'OKP';

  /**
   * Octet Key Pair Elliptic Curve Name.
   */
  readonly crv: Extract<EllipticCurve, 'Ed25519' | 'Ed448' | 'X25519' | 'X448'>;

  /**
   * Octet Key Pair Public Value.
   */
  readonly x: string;

  /**
   * Octet Key Pair Private Value.
   */
  readonly d?: string;
}
