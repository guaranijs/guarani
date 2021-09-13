import { AuthorizationServer } from '../../lib/bootstrap'
import {
  ClientSecretBasic,
  ClientSecretJWT,
  ClientSecretPost,
  None,
  PrivateKeyJWT
} from '../../lib/client-authentication'
import { ClientCredentialsGrant, ImplicitGrant } from '../../lib/grants'
import { ExpressProvider } from '../../lib/providers'
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
  endpoints: [IntrospectionEndpoint, RevocationEndpoint]
})
export class AppProvider extends ExpressProvider {}
