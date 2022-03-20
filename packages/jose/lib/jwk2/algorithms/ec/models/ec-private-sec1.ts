import { ECPublicSPKIParameters } from './ec-public-spki-parameters';

export interface ECPrivateSEC1 {
  readonly version: bigint;
  readonly d: bigint;
  readonly oid: string;
  readonly publicKey: ECPublicSPKIParameters;
}
