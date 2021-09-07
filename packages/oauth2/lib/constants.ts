/**
 * Defines the environment of the application using Guarani.
 */
export const GUARANI_ENV = process.env.GUARANI_ENV || 'production'

/**
 * Supported Client Assertion Types.
 */
export type SupportedClientAssertionType =
  | 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
  | 'urn:ietf:params:oauth:client-assertion-type:saml2-bearer'

/**
 * Supported Client Authentication Methods.
 */
export type SupportedClientAuthentication =
  | 'client_secret_basic'
  | 'client_secret_jwt'
  | 'client_secret_post'
  | 'none'
  | 'private_key_jwt'

/**
 * Supported Endpoints.
 */
export type SupportedEndpoint =
  | 'authorization'
  | 'introspection'
  | 'revocation'
  | 'token'
  | 'user-consent'

/**
 * Supported Grant Types.
 */
export type SupportedGrantType =
  | 'authorization_code'
  | 'client_credentials'
  | 'implicit'
  | 'password'
  | 'refresh_token'
  | 'urn:ietf:params:oauth:grant-type:jwt-bearer'
  | 'urn:ietf:params:oauth:grant-type:saml2-bearer'

/**
 * Supported PKCE Methods.
 */
export type SupportedPkceMethod = 'plain' | 'S256'

/**
 * Supported Response Modes.
 */
export type SupportedResponseMode = 'form_post' | 'fragment' | 'query'

/**
 * Supported Response Types.
 */
export type SupportedResponseType =
  | 'code'
  | 'id_token'
  | 'none'
  | 'token'
  | 'code id_token'
  | 'code token'
  | 'id_token token'
  | 'code id_token token'

/**
 * Supported Token Type Hints.
 */
export type SupportedTokenTypeHint = 'access_token' | 'refresh_token'
