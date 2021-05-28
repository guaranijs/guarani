export interface OAuth2AccessToken {
  getAccessToken(): string

  getTokenType(): string

  isExpired(): boolean

  getScopes(): string[]

  getClientId(): string

  getUserId(): string
}
