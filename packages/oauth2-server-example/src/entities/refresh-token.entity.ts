import { RefreshToken as RefreshTokenEntity } from '@guarani/oauth2'
import { OneOrMany, secretToken } from '@guarani/utils'

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn
} from 'typeorm'

import { AccessToken } from './access-token.entity'
import { Client } from './client.entity'
import { User } from './user.entity'
import { audienceTransformer, transformer } from './_transformer'

interface IRefreshToken {
  readonly scopes: string[]
  readonly audience?: OneOrMany<string>
  readonly client: Client
  readonly user: User
  readonly accessToken: AccessToken
}

@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends BaseEntity implements RefreshTokenEntity {
  @PrimaryColumn({ name: 'token', type: 'varchar', length: 24 })
  public readonly token: string

  @Column({ name: 'scopes', type: 'text', transformer })
  public readonly scopes: string[]

  @Column({
    name: 'audience',
    type: 'text',
    nullable: true,
    transformer: audienceTransformer
  })
  public readonly audience?: OneOrMany<string>

  @OneToOne(() => AccessToken, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'access_token' })
  public readonly accessToken: AccessToken

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
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  public readonly user: User

  @Column({ name: 'expires_at', type: 'datetime' })
  public readonly expiresAt: Date

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  public readonly createdAt: Date

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime' })
  public deletedAt?: Date

  public constructor(data?: IRefreshToken) {
    super()

    if (data) {
      const expiration = new Date()

      expiration.setUTCDate(expiration.getUTCDate() + 7)

      this.token = secretToken(24)
      this.expiresAt = expiration
      this.scopes = data.scopes
      this.audience = data.audience
      this.accessToken = data.accessToken
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

  public getAccessToken(): AccessToken {
    return this.accessToken
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
    return this.audience
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
