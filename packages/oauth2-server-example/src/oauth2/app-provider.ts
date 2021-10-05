import {
  AuthorizationServer,
  ClientCredentialsGrant,
  ClientSecretBasic,
  ClientSecretJWT,
  ClientSecretPost,
  FormPostResponseMode,
  FragmentResponseMode,
  ImplicitGrant,
  None,
  PlainPkceMethod,
  PrivateKeyJWT,
  Provider,
  ProviderFactory,
  QueryResponseMode,
  S256PkceMethod
} from '@guarani/oauth2'
import { AppAdapter } from './app-adapter'
import { IntrospectionEndpoint, RevocationEndpoint } from './endpoints'
import {
  AuthorizationCodeGrant,
  JWTBearerGrant,
  PasswordGrant,
  RefreshTokenGrant
} from './grants'

@AuthorizationServer({
  issuer: 'http://localhost:3333',
  adapter: new AppAdapter(),
  clientAuthentication: [
    ClientSecretBasic,
    ClientSecretJWT,
    ClientSecretPost,
    None,
    PrivateKeyJWT
  ],
  endpoints: [IntrospectionEndpoint, RevocationEndpoint],
  errorUrl: 'http://localhost:3333/oauth2/error',
  grants: [
    AuthorizationCodeGrant,
    ClientCredentialsGrant,
    ImplicitGrant,
    JWTBearerGrant,
    PasswordGrant,
    RefreshTokenGrant
  ],
  pkceMethods: [PlainPkceMethod, S256PkceMethod],
  responseModes: [FormPostResponseMode, FragmentResponseMode, QueryResponseMode]
})
class AppProvider extends Provider {}

export const OAuth2Provider = ProviderFactory.create(AppProvider)
