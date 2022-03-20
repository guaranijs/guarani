/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dict } from '@guarani/types';

import { KeyObject } from 'crypto';

import { JsonWebKey } from '../../../lib/jwk/jsonwebkey';
import { JsonWebKeyParams } from '../../../lib/jwk/jsonwebkey.params';

export class JsonWebKeyMock extends JsonWebKey {
  protected loadCryptoKey(params: JsonWebKeyParams): KeyObject {
    throw new Error('Method not implemented.');
  }

  public export(options: Dict): string;
  public export(options: Dict): Buffer;
  public export(options: Dict): string | Buffer {
    throw new Error('Method not implemented.');
  }
}
