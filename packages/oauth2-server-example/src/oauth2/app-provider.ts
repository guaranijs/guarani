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
  PrivateKeyJWT,
  Provider,
  QueryResponseMode
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
  grants: [
    AuthorizationCodeGrant,
    ClientCredentialsGrant,
    ImplicitGrant,
    JWTBearerGrant,
    PasswordGrant,
    RefreshTokenGrant
  ],
  clientAuthentication: [
    ClientSecretBasic,
    ClientSecretJWT,
    ClientSecretPost,
    None,
    PrivateKeyJWT
  ],
  endpoints: [IntrospectionEndpoint, RevocationEndpoint],
  responseModes: [FormPostResponseMode, FragmentResponseMode, QueryResponseMode]
})
export class AppProvider extends Provider {}
