export interface TokenMetadata {
  readonly active: boolean

  readonly scope?: string

  readonly client_id?: string

  readonly username?: string

  readonly token_type?: string

  readonly exp?: number

  readonly iat?: number

  readonly nbf?: number

  readonly sub?: string

  readonly aud?: string | string[]

  readonly iss?: string

  readonly jti?: string
}
