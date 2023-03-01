import { EllipticCurveKeyParameters } from '../../../jwk/backends/elliptic-curve/elliptic-curve.key.parameters';
import { OctetKeyPairKeyParameters } from '../../../jwk/backends/octet-key-pair/octet-key-pair.key.parameters';
import { JsonWebEncryptionHeaderParameters } from '../../jsonwebencryption.header.parameters';

/**
 * JSON Web Encryption Elliptic Curve Diffie-Hellman Key Wrap Header Parameters.
 */
export interface EcdhHeaderParameters extends JsonWebEncryptionHeaderParameters {
  /**
   * Ephemeral Public Key of the originator.
   */
  readonly epk: EllipticCurveKeyParameters | OctetKeyPairKeyParameters;

  /**
   * Agreement PartyUInfo value.
   */
  readonly apu?: string;

  /**
   * Agreement PartyVInfo value.
   */
  readonly apv?: string;
}
