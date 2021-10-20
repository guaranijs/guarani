/**
 * Supported Client Assertion Types.
 */
export enum SupportedClientAssertionType {
  JwtBearer = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  Saml2Bearer = 'urn:ietf:params:oauth:client-assertion-type:saml2-bearer'
}

/**
 * Supported Client Authentication Methods.
 */
export enum SupportedClientAuthentication {
  ClientSecretBasic = 'client_secret_basic',
  ClientSecretJwt = 'client_secret_jwt',
  ClientSecretPost = 'client_secret_post',
  None = 'none',
  PrivateKeyJwt = 'private_key_jwt'
}

/**
 * Supported Endpoints.
 */
export enum SupportedEndpoint {
  Authorization = 'authorization',
  Introspection = 'introspection',
  Revocation = 'revocation',
  Token = 'token'
}

/**
 * Supported Grant Types.
 */
export enum SupportedGrantType {
  AuthorizationCode = 'authorization_code',
  ClientCredentials = 'client_credentials',
  Implicit = 'implicit',
  Password = 'password',
  RefreshToken = 'refresh_token',
  JwtBearer = 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  Saml2Bearer = 'urn:ietf:params:oauth:grant-type:saml2-bearer'
}

/**
 * Supported PKCE Methods.
 */
export enum SupportedPkceMethod {
  Plain = 'plain',
  S256 = 'S256'
}

/**
 * Supported Response Modes.
 */
export enum SupportedResponseMode {
  FormPost = 'form_post',
  Fragment = 'fragment',
  Query = 'query'
}

/**
 * Supported Response Types.
 */
export enum SupportedResponseType {
  Code = 'code',
  CodeIdToken = 'code id_token',
  CodeIdTokenToken = 'code id_token token',
  CodeToken = 'code token',
  IdToken = 'id_token',
  IdTokenToken = 'id_token token',
  None = 'none',
  Token = 'token'
}

/**
 * Supported Token Type Hints.
 */
export enum SupportedTokenTypeHint {
  AccessToken = 'access_token',
  RefreshToken = 'refresh_token'
}
