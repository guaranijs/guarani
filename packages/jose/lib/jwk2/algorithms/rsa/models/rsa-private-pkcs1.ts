import { Integer, Sequence } from '@guarani/asn1';

@Sequence()
export class RsaPrivatePkcs1 {
  @Integer()
  public readonly version: bigint = 0x00n;

  @Integer()
  public readonly n!: bigint;

  @Integer()
  public readonly e!: bigint;

  @Integer()
  public readonly d!: bigint;

  @Integer()
  public readonly p!: bigint;

  @Integer()
  public readonly q!: bigint;

  @Integer()
  public readonly dp!: bigint;

  @Integer()
  public readonly dq!: bigint;

  @Integer()
  public readonly qi!: bigint;
}
