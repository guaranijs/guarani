import { Column } from 'typeorm';

export class Address {
  @Column({ name: 'address', type: 'varchar', nullable: false })
  public formatted!: string;
}
