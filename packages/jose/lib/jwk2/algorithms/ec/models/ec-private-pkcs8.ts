import { ECPrivatePKCS8Parameters } from './ec-private-pkcs8-parameters';
import { ECPublicOID } from './ec-public-oid';

export interface ECPrivatePKCS8 {
  readonly version: bigint;
  readonly oid: ECPublicOID;
  readonly privateKey: ECPrivatePKCS8Parameters;
}
