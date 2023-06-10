import { JsonWebKeyType } from '../jsonwebkey-type.type';
import { EllipticCurveBackend } from './elliptic-curve/elliptic-curve.backend';
import { OctetKeyPairBackend } from './octet-key-pair/octet-key-pair.backend';
import { OctetSequenceBackend } from './octet-sequence/octet-sequence.backend';
import { RsaBackend } from './rsa/rsa.backend';
import { JsonWebKeyBackend } from './jsonwebkey.backend';

/**
 * JSON Web Key Backend Registry.
 */
export const JSONWEBKEY_REGISTRY: Record<JsonWebKeyType, JsonWebKeyBackend> = {
  EC: new EllipticCurveBackend(),
  OKP: new OctetKeyPairBackend(),
  RSA: new RsaBackend(),
  oct: new OctetSequenceBackend(),
};
