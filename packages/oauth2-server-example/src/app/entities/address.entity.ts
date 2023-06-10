import { Column } from 'typeorm';

import { AddressClaimParameters } from '@guarani/oauth2-server';

export class Address implements AddressClaimParameters {
  @Column({ name: 'address', type: 'varchar', nullable: false })
  public formatted!: string;
}
