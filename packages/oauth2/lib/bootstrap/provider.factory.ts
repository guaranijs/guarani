import { getContainer } from '@guarani/ioc'
import { Constructor } from '@guarani/utils'

import { Adapter } from '../adapter'
import {
  ClientAuthentication,
  ClientAuthenticator,
  ClientSecretBasic
} from '../client-authentication'
import { AuthorizationEndpoint, TokenEndpoint } from '../endpoints'
import { Grant } from '../grants'
import { PkceMethod, PlainPkceMethod, S256PkceMethod } from '../pkce'
import {
  FragmentResponseMode,
  QueryResponseMode,
  ResponseMode
} from '../response-modes'
import { Settings } from '../settings'

class InternalProviderFactory {
  private readonly container = getContainer('oauth2')

  public create<T>(application: Constructor<T>): T {
    this.defineAdapter(application)
    this.defineSettings(application)
    this.addClientAuthentication(application)
    this.addGrants(application)
    this.addResponseModes(application)
    this.addPkceMethods(application)
    this.addEndpoints()

    this.container.bindToken(application).toSelf()

    return this.container.resolve(application)
  }

  private defineAdapter<T>(application: Constructor<T>): void {
    const adapter: Adapter = Reflect.getMetadata(
      'guarani:oauth2:adapter',
      application
    )

    this.container.bindToken<Adapter>('Adapter').toValue(adapter)
  }

  private defineSettings<T>(application: Constructor<T>): void {
    const settings: Settings = Reflect.getMetadata(
      'guarani:oauth2:settings',
      application
    )

    this.container.bindToken(Settings).toValue(settings)
  }

  private addClientAuthentication<T>(application: Constructor<T>): void {
    const methods: Constructor<ClientAuthentication>[] = Reflect.getMetadata(
      'guarani:oidc:client-authentication',
      application
    ) ?? [ClientSecretBasic]

    methods.forEach(method =>
      this.container
        .bindToken<ClientAuthentication>('ClientAuthentication')
        .toClass(method)
    )

    this.container.bindToken(ClientAuthenticator).toSelf()
  }

  private addGrants<T>(application: Constructor<T>): void {
    const grant: Constructor<Grant>[] = Reflect.getMetadata(
      'guarani:oauth2:grants',
      application
    )

    grant.forEach(grant =>
      this.container.bindToken<Grant>('Grant').toClass(grant)
    )
  }

  private addResponseModes<T>(application: Constructor<T>): void {
    const responseModes: Constructor<ResponseMode>[] = Reflect.getMetadata(
      'guarani:oauth2:response-modes',
      application
    ) ?? [FragmentResponseMode, QueryResponseMode]

    responseModes.forEach(responseMode =>
      this.container
        .bindToken<ResponseMode>('ResponseMode')
        .toClass(responseMode)
    )
  }

  private addPkceMethods<T>(application: Constructor<T>): void {
    const pkceMethods: Constructor<PkceMethod>[] = Reflect.getMetadata(
      'guarani:oauth2:pkce-methods',
      application
    ) ?? [PlainPkceMethod, S256PkceMethod]

    pkceMethods.forEach(pkceMethod =>
      this.container.bindToken<PkceMethod>('PkceMethod').toClass(pkceMethod)
    )
  }

  private addEndpoints(): void {
    this.container.bindToken(AuthorizationEndpoint).toSelf()
    this.container.bindToken(TokenEndpoint).toSelf()
  }
}

export const ProviderFactory = new InternalProviderFactory()
