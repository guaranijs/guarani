import { secretToken } from '@guarani/utils'

import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm'

import { SupportedPkceMethod } from '../../lib/constants'
import { AuthorizationCode as AuthorizationCodeEntity } from '../../lib/entities'
import { Client } from './client.entity'
import { User } from './user.entity'

interface IAuthorizationCode {
  readonly redirectUri: string
  readonly scopes: string[]
  readonly codeChallenge: string
  readonly codeChallengeMethod?: SupportedPkceMethod
  readonly client: Client
  readonly user: User
}

const transformer = {
  from: (value: string): string[] => JSON.parse(value),
  to: (value: string[]): string => JSON.stringify(value)
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

  @Column({ name: 'expires_at', type: 'datetime' })
  public readonly expiresAt: Date

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

  public constructor(data?: IAuthorizationCode) {
    super()

    if (data) {
      const expiration = new Date()

      expiration.setUTCSeconds(expiration.getUTCSeconds() + 43200)

      this.code = secretToken(64)
      this.redirectUri = data.redirectUri
      this.scopes = data.scopes
      this.codeChallenge = data.codeChallenge
      this.codeChallengeMethod = data.codeChallengeMethod
      this.expiresAt = expiration
      this.client = data.client
      this.user = data.user
    }
  }

  public getCode(): string {
    return this.code
  }

  public getRedirectUri(): string {
    return this.redirectUri
  }

  public getScopes(): string[] {
    return this.scopes
  }

  public getCodeChallenge(): string {
    return this.codeChallenge
  }

  public getCodeChallengeMethod(): SupportedPkceMethod {
    return this.codeChallengeMethod
  }

  public getExpiresAt(): Date {
    return this.expiresAt
  }

  public getClient(): Client {
    return this.client
  }

  public getUser(): User {
    return this.user
  }
}
