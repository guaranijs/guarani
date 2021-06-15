import { ES256, ES384, ES512 } from './ecdsa'
import { HS256, HS384, HS512 } from './hmac'
import { JWSAlgorithm } from './jws-algorithm'
import { none } from './none'
import { PS256, PS384, PS512, RS256, RS384, RS512 } from './rsassa'

/**
 * Supported JSON Web Signature Algorithms.
 */
export type SupportedJWSAlgorithm =
  | 'ES256'
  | 'ES384'
  | 'ES512'
  | 'HS256'
  | 'HS384'
  | 'HS512'
  | 'none'
  | 'PS256'
  | 'PS384'
  | 'PS512'
  | 'RS256'
  | 'RS384'
  | 'RS512'

/**
 * Store of the supported JWS Algorithms.
 */
export const JWS_ALGORITHMS: Record<SupportedJWSAlgorithm, JWSAlgorithm> = {
  ES256: ES256,
  ES384: ES384,
  ES512: ES512,
  HS256: HS256,
  HS384: HS384,
  HS512: HS512,
  none: none,
  PS256: PS256,
  PS384: PS384,
  PS512: PS512,
  RS256: RS256,
  RS384: RS384,
  RS512: RS512
}
