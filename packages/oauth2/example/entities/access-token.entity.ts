import { Security } from '@guarani/utils'

import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm'

import { OAuth2AccessToken } from '../../lib/models'
import { Client } from './client.entity'
import { User } from './user.entity'

interface IAccessToken {
  readonly scopes: string[]
  readonly client: Client
  readonly user: User
}

const transformer = {
  from: (value: string): string[] => JSON.parse(value),
  to: (value: string[]): string => JSON.stringify(value)
}

@Entity({ name: 'access_tokens' })
export class AccessToken extends BaseEntity implements OAuth2AccessToken {
  @PrimaryColumn({ name: 'access_token', type: 'varchar', length: 32 })
  public readonly accessToken: string

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
    onUpdate: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'user_id' })
  public readonly user?: User

  public constructor(data?: IAccessToken) {
    super()

    if (data) {
      const expiration = new Date()

      expiration.setUTCSeconds(expiration.getUTCSeconds() + 3600)

      this.accessToken = Security.secretToken(32)
      this.expiration = expiration
      this.scopes = data.scopes
      this.client = data.client
      this.user = data.user
    }
  }

  public getAccessToken(): string {
    return this.accessToken
  }

  public getTokenType(): string {
    return 'Bearer'
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
    return this.user?.id
  }
}
