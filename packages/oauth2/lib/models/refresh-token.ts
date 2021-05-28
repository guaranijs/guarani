export interface OAuth2RefreshToken {
  getRefreshToken(): string

  getScopes(): string[]

  isExpired(): boolean

  getClientId(): string

  getUserId(): string
}
