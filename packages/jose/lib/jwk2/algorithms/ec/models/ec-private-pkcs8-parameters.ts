import { ECPublicSPKIParameters } from './ec-public-spki-parameters';

export interface ECPrivatePKCS8Parameters {
  readonly version: bigint;
  readonly d: bigint;
  readonly publicKey: ECPublicSPKIParameters;
}
