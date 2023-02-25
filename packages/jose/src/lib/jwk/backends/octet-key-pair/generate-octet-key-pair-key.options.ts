import { EllipticCurve } from '../elliptic-curve.type';

/**
 * Octet Key Pair JSON Web Key Generation Options.
 */
export interface GenerateOctetKeyPairKeyOptions {
  /**
   * Name of the Elliptic Curve.
   */
  readonly curve: Extract<EllipticCurve, 'Ed25519' | 'Ed448' | 'X25519' | 'X448'>;
}
