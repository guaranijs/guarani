import { SupportedPkceMethod } from '../constants'

export interface PkceMethod {
  readonly name: SupportedPkceMethod

  compare(challenge: string, verifier: string): boolean
}
