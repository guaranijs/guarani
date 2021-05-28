import { Security } from '@guarani/utils'

import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm'

import { OAuth2RefreshToken } from '../../lib/models'
import { Client } from './client.entity'
import { User } from './user.entity'

interface IRefreshToken {
  readonly scopes: string[]
  readonly client: Client
  readonly user: User
}

const transformer = {
  from: (value: string): string[] => JSON.parse(value),
  to: (value: string[]): string => JSON.stringify(value)
}

@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends BaseEntity implements OAuth2RefreshToken {
  @PrimaryColumn({ name: 'refresh_token', type: 'varchar', length: 24 })
  public readonly refreshToken: string

  @Column({ name: 'expiration', type: 'datetime' })
  public expiration: Date

  @Column({ name: 'scopes', type: 'text', transformer })
  public scopes: string[]

  @ManyToOne(() => Client, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'client_id' })
  public readonly client: Client

  @ManyToOne(() => User, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  public readonly user: User

  public constructor(data?: IRefreshToken) {
    super()

    if (data) {
      const expiration = new Date()

      expiration.setUTCDate(expiration.getUTCDate() + 14)

      this.refreshToken = Security.secretToken(24)
      this.expiration = expiration
      this.scopes = data.scopes
      this.client = data.client
      this.user = data.user
    }
  }

  public getRefreshToken(): string {
    return this.refreshToken
  }

  public isExpired(): boolean {
    return new Date() > this.expiration
  }

  public getScopes(): string[] {
    return this.scopes
  }

  public getClientId(): string {
    return this.client.id
  }

  public getUserId(): string {
    return this.user.id
  }
}
