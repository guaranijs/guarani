import { Exclude, Expose } from 'class-transformer'
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export interface IAddress {
  readonly streetAddress: string
  readonly locality: string
  readonly region: string
  readonly country: string
  readonly postalCode: string
}

@Entity({ name: 'addresses' })
export class Address extends BaseEntity {
  @Exclude()
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'integer' })
  public readonly id: number

  @Expose({ name: 'street_address' })
  @Column({ name: 'street_address', type: 'text' })
  public streetAddress: string

  @Expose({ name: 'locality' })
  @Column({ name: 'locality', type: 'text' })
  public locality: string

  @Expose({ name: 'region' })
  @Column({ name: 'region', type: 'text' })
  public region: string

  @Expose({ name: 'postal_code' })
  @Column({ name: 'postal_code', type: 'text' })
  public postalCode: string

  @Expose({ name: 'country' })
  @Column({ name: 'country', type: 'text' })
  public country: string

  @Expose({ name: 'formatted' })
  public get formatted(): string {
    return `${this.streetAddress}, ${this.locality}, ${this.region}, ${this.country} - ${this.postalCode}`
  }

  public constructor(data?: IAddress) {
    super()

    if (data) {
      this.streetAddress = data.streetAddress
      this.locality = data.locality
      this.region = data.region
      this.postalCode = data.postalCode
      this.country = data.country
    }
  }
}
