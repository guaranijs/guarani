import { Constructor } from '@guarani/types';

import { JsonWebKey } from '../jsonwebkey';
import { EcKey } from './ec/ec.key';
import { OctKey } from './oct/oct.key';
import { RsaKey } from './rsa/rsa.key';
import { SupportedJsonWebKeyAlgorithm } from './types/supported-jsonwebkey-algorithm';

/**
 * JSON Web Key Algorithms Registry.
 */
export const JSON_WEB_KEY_ALGORITHMS_REGISTRY: Record<SupportedJsonWebKeyAlgorithm, Constructor<JsonWebKey>> = {
  EC: EcKey,
  RSA: RsaKey,
  oct: OctKey,
};
