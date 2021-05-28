import { Claim, Scope } from './models'

export interface SettingsParams {
  readonly issuer: string
  readonly scopes?: Scope[]
  readonly claims?: Claim[]
  readonly tokenLifespan: number
}

export class Settings {
  public readonly issuer: string
  public readonly scopes: Scope[]
  public readonly claims: Claim[]
  public readonly tokenLifespan: number
  public readonly environment: string

  public constructor(params: SettingsParams) {
    this.issuer = params.issuer
    this.scopes = [...(params.scopes ?? []), ...(params.claims ?? [])]
    this.claims = params.claims ?? []
    this.tokenLifespan = params.tokenLifespan
    this.environment = process.env.GUARANI_ENV ?? 'DEVELOPMENT'
  }
}
