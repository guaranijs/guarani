import { JsonWebKey, KeyOptions } from '../../lib/jwk'

export class MockKey extends JsonWebKey {
  public kty: string

  public constructor(options?: KeyOptions) {
    super(options)
  }

  public export(): string {
    return ''
  }
}
