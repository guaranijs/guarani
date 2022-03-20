import { Integer, Sequence } from '@guarani/asn1';

@Sequence()
export class RsaPublicPkcs1 {
  @Integer()
  public readonly n!: bigint;

  @Integer()
  public readonly e!: bigint;
}
