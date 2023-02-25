import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { ES256, ES384, ES512 } from './ecdsa.backend';
import { HS256, HS384, HS512 } from './hmac.backend';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';
import { none } from './none.backend';
import { PS256, PS384, PS512, RS256, RS384, RS512 } from './rsassa.backend';

/**
 * JSON Web Signature Backend Registry.
 */
export const JSONWEBSIGNATURE_REGISTRY: Record<JsonWebSignatureAlgorithm, JsonWebSignatureBackend> = {
  ES256,
  ES384,
  ES512,
  HS256,
  HS384,
  HS512,
  none,
  PS256,
  PS384,
  PS512,
  RS256,
  RS384,
  RS512,
};
