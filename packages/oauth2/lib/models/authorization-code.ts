export interface OAuth2AuthorizationCode {
  getCode(): string

  getRedirectUri(): string

  getScopes(): string[]

  getCodeChallenge(): string

  getCodeChallengeMethod(): string

  isExpired(): boolean

  getClientId(): string

  getUserId(): string
}
