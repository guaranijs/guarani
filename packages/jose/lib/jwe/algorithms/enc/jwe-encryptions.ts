import { A128CBC_HS256, A192CBC_HS384, A256CBC_HS512 } from './cbc'
import { A128GCM, A192GCM, A256GCM } from './gcm'
import { JWEEncryption } from './jwe-encryption'

export type SupportedJWEEncryption =
  | 'A128CBC-HS256'
  | 'A192CBC-HS384'
  | 'A256CBC-HS512'
  | 'A128GCM'
  | 'A192GCM'
  | 'A256GCM'

export const JWE_ENCRYPTIONS: Record<SupportedJWEEncryption, JWEEncryption> = {
  'A128CBC-HS256': A128CBC_HS256,
  'A192CBC-HS384': A192CBC_HS384,
  'A256CBC-HS512': A256CBC_HS512,
  A128GCM: A128GCM,
  A192GCM: A192GCM,
  A256GCM: A256GCM
}
