import { UUID } from '@guarani/utils'

import argon2 from 'argon2'
import { Exclude, Expose } from 'class-transformer'
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm'

import { User as UserEntity } from '../../lib/entities'

export interface IAddress {
  street_address: string
  locality: string
  region: string
  country: string
  postal_code: string
}

export interface IUser {
  readonly password: string
  readonly givenName: string
  readonly middleName?: string
  readonly familyName: string
  readonly email: string
  readonly birthdate?: Date
  readonly phoneNumber?: string
  readonly address?: IAddress
}

@Entity({ name: 'users' })
export class User extends BaseEntity implements UserEntity {
  @Expose({ name: 'id' })
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  public readonly id: string

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 32 })
  public password: string

  @Expose({ name: 'given_name' })
  @Column({ name: 'given_name', type: 'varchar', length: 16 })
  public givenName: string

  @Expose({ name: 'middle_name' })
  @Column({ name: 'middle_name', type: 'varchar', length: 32, nullable: true })
  public middleName?: string

  @Expose({ name: 'family_name' })
  @Column({ name: 'family_name', type: 'varchar', length: 64 })
  public familyName: string

  @Expose({ name: 'email' })
  @Column({ name: 'email', type: 'varchar', length: 64 })
  public email: string

  @Expose({ name: 'email_verified' })
  @Column({ name: 'email_verified', type: 'boolean' })
  public emailVerified: boolean

  @Expose({ name: 'birthdate' })
  @Column({ name: 'birthdate', type: 'date', nullable: true })
  public birthdate?: Date

  @Expose({ name: 'phone_number' })
  @Column({ name: 'phone_number', type: 'varchar', length: 64, nullable: true })
  public phoneNumber?: string

  @Expose({ name: 'phone_number_verified' })
  @Column({ name: 'phone_number_verified', type: 'boolean', nullable: true })
  public phoneNumberVerified?: boolean

  @Expose({ name: 'address' })
  @Column({ name: 'address', type: 'text', nullable: true })
  public address?: IAddress

  public constructor(user?: Omit<IUser, 'password'>) {
    super()

    if (user) {
      this.id = String(new UUID())
      this.givenName = user.givenName
      this.middleName = user.middleName
      this.familyName = user.familyName
      this.email = user.email
      this.emailVerified = false
      this.birthdate = user.birthdate
      this.phoneNumber = user.phoneNumber
      this.phoneNumberVerified = user.phoneNumber ? false : null
      this.address = user.address
    }
  }

  public get fullName(): string {
    return `${this.givenName} ${this.middleName ?? ''} ${this.familyName}`
  }

  public async setPassword(password: string): Promise<void> {
    this.password = await argon2.hash(password, { type: argon2.argon2id })
  }

  public getUserId(): string {
    return this.id
  }

  public async checkPassword(password: string): Promise<boolean> {
    return await argon2.verify(this.password, password, {
      type: argon2.argon2id
    })
  }
}
