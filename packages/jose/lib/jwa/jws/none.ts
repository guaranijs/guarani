import type { JsonWebKey } from '../../jwk'
import { JWSAlgorithm } from './algorithm'

class None extends JWSAlgorithm {
  public constructor () { super(undefined) }

  public sign (data: Buffer, key?: JsonWebKey): string { return '' }
  public verify (signature: string, data: Buffer, key?: JsonWebKey): void {}
}

export function none (): None {
  return new None()
}
