import { ECPublicOID } from './ec-public-oid';
import { ECPublicSPKIParameters } from './ec-public-spki-parameters';

export interface ECPublicSPKI {
  readonly oid: ECPublicOID;
  readonly publicKey: ECPublicSPKIParameters;
}
