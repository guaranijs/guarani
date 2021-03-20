import { JWSAlgorithm } from './base'
import { ES256, ES384, ES512 } from './ecdsa'
import { HS256, HS384, HS512 } from './hmac'
import { none } from './none'
import { PS256, PS384, PS512, RS256, RS384, RS512 } from './rsassa'

export const Algorithms: { [algorithm: string]: () => JWSAlgorithm } = {
  none,
  ES256,
  ES384,
  ES512,
  HS256,
  HS384,
  HS512,
  PS256,
  PS384,
  PS512,
  RS256,
  RS384,
  RS512
}

export { JWSAlgorithm }
