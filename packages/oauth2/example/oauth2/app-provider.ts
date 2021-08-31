import { AuthorizationServer } from '../../lib/bootstrap'
import {
  AuthorizationCodeGrant,
  ClientCredentialsGrant,
  ImplicitGrant,
  PasswordGrant,
  RefreshTokenGrant
} from '../../lib/grants'
import { ExpressProvider } from '../../lib/providers'
import { AppAdapter } from './app-adapter'

@AuthorizationServer({
  issuer: 'http://localhost:3333',
  adapter: new AppAdapter(),
  grants: [
    AuthorizationCodeGrant,
    ClientCredentialsGrant,
    ImplicitGrant,
    PasswordGrant,
    RefreshTokenGrant
  ]
})
export class AppProvider extends ExpressProvider {}
