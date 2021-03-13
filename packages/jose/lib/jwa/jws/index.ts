/**
 * Implements the Section 3 of the RFC 7518.
 *
 * @module JWSA
 */

export { JWSAlgorithm } from './algorithm'
export { ES256, ES384, ES512 } from './ecdsa'
export { HS256, HS384, HS512 } from './hmac'
export { none } from './none'
export { PS256, PS384, PS512, RS256, RS384, RS512 } from './rsa'
