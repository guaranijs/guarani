import { Base64Url } from '@guarani/utils'

import {
  createPrivateKey,
  createPublicKey,
  privateDecrypt,
  publicEncrypt
} from 'crypto'

import { RsaKey, RsaPadding } from '../../../jwk'
import { SupportedHash } from '../../../types'
import { WrappedKey } from '../../_types'
import { JWEEncryption } from '../enc'
import { JWEAlgorithm } from './jwe-algorithm'

class RSAAlgorithm extends JWEAlgorithm {
  public constructor(
    protected readonly algorithm: string,
    protected readonly padding: RsaPadding,
    protected readonly hash?: SupportedHash
  ) {
    super(algorithm)
  }

  public async wrap(enc: JWEEncryption, key: RsaKey): Promise<WrappedKey> {
    const cek = enc.generateCEK()
    const publicKey = createPublicKey(key.export('public', 'pem', 'pkcs1'))
    const ek = publicEncrypt(
      { key: publicKey, oaepHash: this.hash, padding: this.padding },
      cek
    )

    return { cek, ek: Base64Url.encode(ek) }
  }

  public async unwrap(
    enc: JWEEncryption,
    ek: Buffer,
    key: RsaKey
  ): Promise<Buffer> {
    const privateKey = createPrivateKey(key.export('private', 'pem', 'pkcs1'))
    const cek = privateDecrypt(
      { key: privateKey, oaepHash: this.hash, padding: this.padding },
      ek
    )

    enc.checkKey(cek)

    return cek
  }
}

export const RSA1_5 = new RSAAlgorithm('RSA1_5', RsaPadding.PKCS1)

export const RSA_OAEP = new RSAAlgorithm('RSA-OAEP', RsaPadding.OAEP, 'SHA1')

export const RSA_OAEP_256 = new RSAAlgorithm(
  'RSA-OAEP-256',
  RsaPadding.OAEP,
  'SHA256'
)

export const RSA_OAEP_384 = new RSAAlgorithm(
  'RSA-OAEP-384',
  RsaPadding.OAEP,
  'SHA384'
)

export const RSA_OAEP_512 = new RSAAlgorithm(
  'RSA-OAEP-512',
  RsaPadding.OAEP,
  'SHA512'
)
