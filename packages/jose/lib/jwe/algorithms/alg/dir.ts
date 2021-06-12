import { OctKey } from '../../../jwk'
import { WrappedKey } from '../../_types'
import { JWEEncryption } from '../enc'
import { JWEAlgorithm } from './jwe-algorithm'

class DIRAlgorithm extends JWEAlgorithm {
  public async wrap(enc: JWEEncryption, key: OctKey): Promise<WrappedKey> {
    const cek = key.export('binary')
    enc.checkKey(cek)
    return { cek, ek: '' }
  }

  public async unwrap(
    enc: JWEEncryption,
    ek: Buffer,
    key: OctKey
  ): Promise<Buffer> {
    const cek = key.export('binary')
    enc.checkKey(cek)
    return cek
  }
}

export const dir = new DIRAlgorithm('dir')
