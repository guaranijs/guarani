import { OneOrMany, secretToken } from '@guarani/utils'

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm'

import { SupportedGrantType } from '../../lib/constants'
import { AccessToken as AccessTokenEntity } from '../../lib/entities'
import { Client } from './client.entity'
import { User } from './user.entity'

interface IAccessToken {
  readonly grant: SupportedGrantType
  readonly expiresIn: number
  readonly scopes: string[]
  readonly client: Client
  readonly user: User
}

const transformer = {
  from: (value: string): string[] => JSON.parse(value),
  to: (value: string[]): string => JSON.stringify(value)
}

@Entity({ name: 'access_tokens' })
export class AccessToken extends BaseEntity implements AccessTokenEntity {
  @PrimaryColumn({ name: 'token', type: 'varchar', length: 32 })
  public readonly token: string

  @Column({ name: 'expiration', type: 'datetime' })
  public readonly expiresAt: Date

  @Column({ name: 'scopes', type: 'text', transformer })
  public readonly scopes: string[]

  @Column({ name: 'grant', type: 'varchar', length: 256 })
  public readonly grant: SupportedGrantType

  @ManyToOne(() => Client, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'client_id' })
  public readonly client: Client

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'user_id' })
  public readonly user?: User

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  public readonly createdAt: Date

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime' })
  public deletedAt?: Date

  public constructor(data?: IAccessToken) {
    super()

    if (data) {
      const expiration = new Date()

      expiration.setUTCSeconds(expiration.getUTCSeconds() + data.expiresIn)

      this.token = secretToken(32)
      this.expiresAt = expiration
      this.scopes = data.scopes
      this.grant = data.grant
      this.client = data.client
      this.user = data.user
    }
  }

  public getIdentifier(): string {
    return this.token
  }

  public getScopes(): string[] {
    return this.scopes
  }

  public getExpiresAt(): Date {
    return this.expiresAt
  }

  public getIssuedAt(): Date {
    return this.createdAt
  }

  public getValidAfter(): Date {
    return this.getIssuedAt()
  }

  public getAudience(): OneOrMany<string> {
    return this.client.getClientId()
  }

  public getGrant(): SupportedGrantType {
    return this.grant
  }

  public getClient(): Client {
    return this.client
  }

  public getUser(): User {
    return this.user
  }

  public isRevoked(): boolean {
    return this.deletedAt != null
  }
}
