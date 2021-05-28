import { OAuth2AuthorizationCode } from '../../lib/models'
import { redis } from '../redis'

interface ICode {
  readonly code: string
  readonly redirect_uri: string
  readonly scopes: string[]
  readonly code_challenge: string
  readonly code_challenge_method: string
  readonly client_id: string
  readonly user_id: string
}

export class AuthorizationCode implements OAuth2AuthorizationCode {
  public readonly code: string

  public readonly redirect_uri: string

  public readonly scopes: string[]

  public readonly code_challenge: string

  public readonly code_challenge_method: string

  public readonly client_id: string

  public readonly user_id: string

  public constructor(data: ICode) {
    this.code = data.code
    this.client_id = data.client_id
    this.code_challenge = data.code_challenge
    this.code_challenge_method = data.code_challenge_method
    this.redirect_uri = data.redirect_uri
    this.scopes = data.scopes
    this.user_id = data.user_id
  }

  public static async findOne(code: string): Promise<AuthorizationCode> {
    const data = await redis.get(`code:${code}`)
    return data ? new AuthorizationCode(JSON.parse(data)) : null
  }

  public async save(): Promise<void> {
    await redis.setex(`code:${this.code}`, 300, JSON.stringify(this))
  }

  public static async remove(code: string): Promise<void> {
    await redis.del(`code:${code}`)
  }

  public getCode(): string {
    return this.code
  }

  public getRedirectUri(): string {
    return this.redirect_uri
  }

  public getScopes(): string[] {
    return this.scopes
  }

  public getCodeChallenge(): string {
    return this.code_challenge
  }

  public getCodeChallengeMethod(): string {
    return this.code_challenge_method
  }

  public isExpired(): boolean {
    return false
  }

  public getClientId(): string {
    return this.client_id
  }

  public getUserId(): string {
    return this.user_id
  }
}
