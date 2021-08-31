export interface OAuth2Token {
  readonly access_token: string
  readonly token_type: string
  readonly expires_in: number
  readonly scope: string
  readonly refresh_token?: string
  [parameter: string]: any
}
