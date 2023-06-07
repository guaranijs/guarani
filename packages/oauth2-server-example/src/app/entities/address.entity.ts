import { AddressClaimParameters } from '@guarani/oauth2-server';

import { Column } from 'typeorm';

export class Address implements AddressClaimParameters {
  @Column({ name: 'address', type: 'varchar', nullable: false })
  public formatted!: string;
}
