/**
 * Dependency Injection Tokens.
 */
export enum MetadataToken {
  /**
   * Client Authentication Methods.
   */
  ClientAuthentication = 'guarani:oauth2:client-authentication',

  /**
   * Endpoints.
   */
  Endpoints = 'guarani:oauth2:endpoints',

  /**
   * Error Endpoint URL.
   */
  ErrorUrl = 'guarani:oauth2:error-url',

  /**
   * Grant Types.
   */
  GrantTypes = 'guarani:oauth2:grant-types',

  /**
   * Issuer Url.
   */
  Issuer = 'guarani:oauth2:issuer',

  /**
   * PKCE Methods.
   */
  PkceMethods = 'guarani:oauth2:pkce-methods',

  /**
   * Response Modes.
   */
  ResponseModes = 'guarani:oauth2:response-modes',

  /**
   * Response Types.
   */
  ResponseTypes = 'guarani:oauth2:response-types',

  /**
   * Allowed Scopes.
   */
  Scopes = 'guarani:oauth2:scopes',

  /**
   * Client Service.
   */
  ClientService = 'guarani:oauth2:client-service',

  /**
   * Access Token Service.
   */
  AccessTokenService = 'guarani:oauth2:access-token-service',

  /**
   * User Service.
   */
  UserService = 'guarani:oauth2:user-service',

  /**
   * AuthorizationCode Service.
   */
  AuthorizationCodeService = 'guarani:oauth2:authorization-code-service',

  /**
   * RefreshToken Service.
   */
  RefreshTokenService = 'guarani:oauth2:refresh-token-service',
}
