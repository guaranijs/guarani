import { getContainer } from '@guarani/ioc'
import { Constructor } from '@guarani/utils'

import { Adapter } from '../adapter'
import {
  ClientAuthentication,
  ClientAuthenticator,
  ClientSecretBasic
} from '../client-authentication'
import { AuthorizationEndpoint, Endpoint, TokenEndpoint } from '../endpoints'
import { AuthorizationCodeGrant, Grant, ImplicitGrant } from '../grants'
import { PkceMethod, PlainPkceMethod, S256PkceMethod } from '../pkce'
import {
  FragmentResponseMode,
  QueryResponseMode,
  ResponseMode
} from '../response-modes'
import { Settings } from '../settings'

/**
 * Factory for configuring and instantiating a new OAuth 2.0 Provider.
 */
class InternalProviderFactory {
  /**
   * Dependency Injection Container.
   */
  private readonly container = getContainer('oauth2')

  /**
   * Fabricates a new instance of the OAuth 2.0 Authorization Server.
   *
   * @param application Provider class decorated and configured.
   * @returns Instantiated OAuth 2.0 Authorization Server.
   */
  public create<T>(application: Constructor<T>): T {
    this.defineAdapter(application)
    this.defineSettings(application)
    this.addClientAuthentication(application)
    this.addGrants(application)
    this.addResponseModes(application)
    this.addPkceMethods(application)
    this.addEndpoints(application)

    this.container.bindToken(application).toSelf()

    return this.container.resolve(application)
  }

  /**
   * Defines the Adapter of the Authorization Server.
   *
   * @param application Authorization Server.
   */
  private defineAdapter<T>(application: Constructor<T>): void {
    const adapter: Adapter = Reflect.getMetadata(
      'guarani:oauth2:adapter',
      application
    )

    this.container.bindToken<Adapter>('Adapter').toValue(adapter)
  }

  /**
   * Defines the Settings of the Authorization Server.
   *
   * @param application Authorization Server.
   */
  private defineSettings<T>(application: Constructor<T>): void {
    const settings: Settings = Reflect.getMetadata(
      'guarani:oauth2:settings',
      application
    )

    this.container.bindToken(Settings).toValue(settings)
  }

  /**
   * Defines the Client Authentication Methods of the Authorization Server.
   *
   * @param application Authorization Server.
   */
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

  /**
   * Defines the OAuth 2.0 Grants of the Authorization Server.
   *
   * @param application Authorization Server.
   */
  private addGrants<T>(application: Constructor<T>): void {
    const grant: Constructor<Grant>[] = Reflect.getMetadata(
      'guarani:oauth2:grants',
      application
    ) ?? [AuthorizationCodeGrant, ImplicitGrant]

    grant.forEach(grant =>
      this.container.bindToken<Grant>('Grant').toClass(grant)
    )
  }

  /**
   * Defines the Response Modes of the Authorization Server.
   *
   * @param application Authorization Server.
   */
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

  /**
   * Defines the PKCE Methods of the Authorization Server.
   *
   * @param application Authorization Server.
   */
  private addPkceMethods<T>(application: Constructor<T>): void {
    const pkceMethods: Constructor<PkceMethod>[] = Reflect.getMetadata(
      'guarani:oauth2:pkce-methods',
      application
    ) ?? [PlainPkceMethod, S256PkceMethod]

    pkceMethods.forEach(pkceMethod =>
      this.container.bindToken<PkceMethod>('PkceMethod').toClass(pkceMethod)
    )
  }

  /**
   * Defines the Endpoints of the Authorization Server.
   *
   * @param application Authorization Server.
   */
  private addEndpoints<T>(application: Constructor<T>): void {
    const endpoints: Constructor<Endpoint>[] =
      Reflect.getMetadata('guarani:oauth2:endpoints', application) ?? []

    endpoints.push(AuthorizationEndpoint, TokenEndpoint)

    endpoints.forEach(endpoint =>
      this.container.bindToken<Endpoint>('Endpoint').toClass(endpoint)
    )
  }
}

export const ProviderFactory = new InternalProviderFactory()
