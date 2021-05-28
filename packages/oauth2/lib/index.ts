if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error(`@guarani/ioc requires a Reflect Metadata polyfill.`)
}

export { Adapter } from './adapter'
export {
  ClientAuthentication,
  ClientSecretBasic,
  ClientSecretPost,
  None
} from './authentication'
export { AuthorizationServer, ProviderFactory } from './bootstrap'
export {
  OAuth2EmptyResponse,
  OAuth2HTMLResponse,
  OAuth2JSONResponse,
  OAuth2RedirectResponse,
  OAuth2Request,
  OAuth2Response
} from './context'
export {
  Endpoint,
  IntrospectionEndpoint,
  RevocationEndpoint
} from './endpoints'
export {
  AccessDenied,
  ErrorParams,
  ErrorResponse,
  InvalidClient,
  InvalidGrant,
  InvalidRequest,
  InvalidScope,
  OAuth2Error,
  ServerError,
  TemporarilyUnavailable,
  UnauthorizedClient,
  UnsupportedGrantType,
  UnsupportedResponseType,
  UnsupportedTokenType
} from './exceptions'
export {
  AuthorizationCodeGrant,
  AuthorizationGrant,
  ClientCredentialsGrant,
  Grant,
  ImplicitGrant,
  RefreshTokenGrant,
  ResourceOwnerPasswordCredentialsGrant,
  TokenGrant
} from './grants'
export {
  Claim,
  OAuth2AccessToken,
  OAuth2AuthorizationCode,
  OAuth2Client,
  OAuth2RefreshToken,
  OAuth2Token,
  OAuth2User,
  Scope,
  TokenMetadata
} from './models'
export { ExpressProvider, Provider } from './providers'
