import { UUID } from '@guarani/utils'

import argon2 from 'argon2'
import { Exclude, Expose } from 'class-transformer'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'

import { Address, IAddress } from './address.entity'

export interface IUser {
  readonly password: string
  readonly givenName: string
  readonly middleName?: string
  readonly familyName: string
  readonly nickname?: string
  readonly preferredUsername?: string
  readonly picture?: string
  readonly website?: string
  readonly facebook?: string
  readonly twitter?: string
  readonly instagram?: string
  readonly github?: string
  readonly linkedin?: string
  readonly email: string
  readonly gender?: string
  readonly birthdate?: Date
  readonly phoneNumber?: string
  readonly address?: IAddress
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
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

  @Expose({ name: 'nickname' })
  @Column({ name: 'nickname', type: 'varchar', length: 32, nullable: true })
  public nickname?: string

  @Expose({ name: 'preferred_username' })
  @Column({
    name: 'preferred_username',
    type: 'varchar',
    length: 32,
    nullable: true
  })
  public preferredUsername?: string

  @Expose({ name: 'picture' })
  @Column({ name: 'picture', type: 'varchar', length: 256, nullable: true })
  public picture?: string

  @Expose({ name: 'website' })
  @Column({ name: 'website', type: 'varchar', length: 256, nullable: true })
  public website?: string

  @Expose({ name: 'facebook' })
  @Column({ name: 'facebook', type: 'varchar', length: 256, nullable: true })
  public facebook?: string

  @Expose({ name: 'twitter' })
  @Column({ name: 'twitter', type: 'varchar', length: 256, nullable: true })
  public twitter?: string

  @Expose({ name: 'instagram' })
  @Column({ name: 'instagram', type: 'varchar', length: 256, nullable: true })
  public instagram?: string

  @Expose({ name: 'github' })
  @Column({ name: 'github', type: 'varchar', length: 256, nullable: true })
  public github?: string

  @Expose({ name: 'linkedin' })
  @Column({ name: 'linkedin', type: 'varchar', length: 256, nullable: true })
  public linkedin?: string

  @Expose({ name: 'email' })
  @Column({ name: 'email', type: 'varchar', length: 64 })
  public email: string

  @Expose({ name: 'email_verified' })
  @Column({ name: 'email_verified', type: 'boolean' })
  public emailVerified: boolean

  @Expose({ name: 'gender' })
  @Column({
    name: 'gender',
    type: 'varchar',
    length: 1,
    enum: ['M', 'F'],
    nullable: true
  })
  public gender?: string

  @Expose({ name: 'birthdate' })
  @Column({
    name: 'birthdate',
    type: 'date',
    nullable: true,
    transformer: {
      to: (value: Date) => value,
      from: (value: string) => new Date(value)
    }
  })
  public birthdate?: Date

  @Expose({ name: 'phone_number' })
  @Column({ name: 'phone_number', type: 'varchar', length: 64, nullable: true })
  public phoneNumber?: string

  @Expose({ name: 'phone_number_verified' })
  @Column({ name: 'phone_number_verified', type: 'boolean' })
  public phoneNumberVerified: boolean

  @Expose({ name: 'address' })
  @OneToOne(() => Address, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'address' })
  public address?: Address

  @Expose({ name: 'created_at' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  public createdAt: Date

  @Expose({ name: 'updated_at' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  public updatedAt: Date

  @Expose({ name: 'deleted_at' })
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  public deletedAt?: Date

  public constructor(user?: Omit<IUser, 'password'>) {
    super()

    if (user) {
      this.id = String(new UUID())
      this.givenName = user.givenName
      this.middleName = user.middleName
      this.familyName = user.familyName
      this.nickname = user.nickname
      this.preferredUsername = user.preferredUsername
      this.picture = user.picture
      this.website = user.website
      this.facebook = user.facebook
      this.twitter = user.twitter
      this.instagram = user.instagram
      this.github = user.github
      this.linkedin = user.linkedin
      this.email = user.email
      this.emailVerified = false
      this.gender = user.gender
      this.birthdate = user.birthdate
      this.phoneNumber = user.phoneNumber
      this.phoneNumberVerified = false
      this.address = new Address(user.address)
    }
  }

  @Expose({ name: 'name' })
  public get name(): string {
    let name = this.givenName

    if (this.middleName) {
      name += ` ${this.middleName}`
    }

    name += ` ${this.familyName}`

    return name
  }

  @Expose({ name: 'profile' })
  public get profile(): string {
    return `http://localhost:3333/users/${this.id}`
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
