import { Dict } from '@guarani/utils'

export interface AuthenticatedEncryption {
  readonly ciphertext: string
  readonly tag: string
}

export interface WrappedKey<AdditionalJoseHeaderParams = Dict<any>> {
  readonly cek: Buffer
  readonly ek: string
  readonly header?: AdditionalJoseHeaderParams
}
