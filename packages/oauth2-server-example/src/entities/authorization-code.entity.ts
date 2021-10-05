import {
  AuthorizationCode as AuthorizationCodeEntity,
  SupportedPkceMethod
} from '@guarani/oauth2'
import { OneOrMany, secretToken } from '@guarani/utils'

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm'

import { Client } from './client.entity'
import { User } from './user.entity'
import { audienceTransformer, transformer } from './_transformer'

interface IAuthorizationCode {
  readonly redirectUri: string
  readonly scopes: string[]
  readonly codeChallenge: string
  readonly codeChallengeMethod?: SupportedPkceMethod
  readonly nonce?: string
  readonly audience?: OneOrMany<string>
  readonly client: Client
  readonly user: User
}

@Entity({ name: 'authorization_codes' })
export class AuthorizationCode
  extends BaseEntity
  implements AuthorizationCodeEntity {
  @PrimaryColumn({ name: 'code', type: 'varchar', length: 64 })
  public readonly code: string

  @Column({ name: 'redirect_uri', type: 'text', nullable: true })
  public readonly redirectUri?: string

  @Column({ name: 'scopes', type: 'text', transformer })
  public readonly scopes: string[]

  @Column({ name: 'code_challenge', type: 'varchar', length: 128 })
  public readonly codeChallenge: string

  @Column({
    name: 'code_challenge_method',
    type: 'varchar',
    length: 8,
    nullable: true
  })
  public readonly codeChallengeMethod?: SupportedPkceMethod

  @Column({ name: 'nonce', type: 'text', nullable: true })
  public readonly nonce?: string

  @Column({
    name: 'audience',
    type: 'text',
    nullable: true,
    transformer: audienceTransformer
  })
  public readonly audience?: OneOrMany<string>

  @Column({ name: 'expires_at', type: 'datetime' })
  public readonly expiresAt: Date

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  public readonly createdAt: Date

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

  public constructor(data?: IAuthorizationCode) {
    super()

    if (data) {
      const expiration = new Date()

      expiration.setUTCSeconds(expiration.getUTCSeconds() + 43200)

      this.code = secretToken(64)
      this.redirectUri = data.redirectUri
      this.scopes = data.scopes
      this.audience = data.audience
      this.codeChallenge = data.codeChallenge
      this.codeChallengeMethod = data.codeChallengeMethod
      this.nonce = data.nonce
      this.expiresAt = expiration
      this.client = data.client
      this.user = data.user
    }
  }

  public getIdentifier(): string {
    return this.code
  }

  public getScopes(): string[] {
    return this.scopes
  }

  public getIssuedAt(): Date {
    return this.createdAt
  }

  public getExpiresAt(): Date {
    return this.expiresAt
  }

  public getValidAfter(): Date {
    return this.getIssuedAt()
  }

  public getAudience(): OneOrMany<string> {
    return this.audience
  }

  public getRedirectUri(): string {
    return this.redirectUri
  }

  public getCodeChallenge(): string {
    return this.codeChallenge
  }

  public getCodeChallengeMethod(): SupportedPkceMethod {
    return this.codeChallengeMethod
  }

  public getNonce(): string {
    return this.nonce
  }

  public getAuthTime(): Date {
    return null
  }

  public getClient(): Client {
    return this.client
  }

  public getUser(): User {
    return this.user
  }

  public isRevoked(): boolean {
    return new Date() > this.getExpiresAt()
  }
}
