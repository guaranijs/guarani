import { Container } from '@guarani/ioc'
import { Constructor } from '@guarani/utils'

import { Adapter } from '../adapter'
import { ClientAuthentication } from '../authentication'
import { AuthorizationEndpoint, Endpoint, TokenEndpoint } from '../endpoints'
import { Grant } from '../grants'
import { Provider } from '../providers'
import { Settings } from '../settings'

class InternalProviderFactory {
  public create<T extends Provider>(application: Constructor<T>): T {
    this.defineAdapter(application)
    this.defineSettings(application)
    this.addClientAuthentication(application)
    this.addEndpoints(application)
    this.addGrants(application)

    Container.bindToken(application).toSelf()

    return Container.resolve(application)
  }

  private defineAdapter<T>(application: Constructor<T>): void {
    const adapter: Adapter = Reflect.getMetadata(
      'guarani:oidc:adapter',
      application
    )

    Container.bindToken<Adapter>('Adapter').toValue(adapter)
  }

  private defineSettings<T>(application: Constructor<T>): void {
    const settings: Settings = Reflect.getMetadata(
      'guarani:oidc:settings',
      application
    )

    Container.bindToken(Settings).toValue(settings)
  }

  private addClientAuthentication<T>(application: Constructor<T>): void {
    const methods: Constructor<ClientAuthentication>[] = Reflect.getMetadata(
      'guarani:oidc:client-authentication',
      application
    )

    methods.forEach(method =>
      Container.bindToken<ClientAuthentication>('ClientAuthentication').toClass(
        method
      )
    )
  }

  private addEndpoints<T>(application: Constructor<T>): void {
    const endpoints: Constructor<Endpoint>[] =
      Reflect.getMetadata('guarani:oidc:endpoints', application) ?? []

    endpoints.push(AuthorizationEndpoint)
    endpoints.push(TokenEndpoint)

    endpoints.forEach(endpoint =>
      Container.bindToken<Endpoint>('Endpoint').toClass(endpoint)
    )
  }

  private addGrants<T>(application: Constructor<T>): void {
    const grants: Constructor<Grant>[] = Reflect.getMetadata(
      'guarani:oidc:grants',
      application
    )

    if (grants) {
      grants.forEach(grant =>
        Container.bindToken<Grant>('Grant').toClass(grant)
      )
    } else {
      Container.bindToken<Grant>('Grant').toValue([])
    }
  }
}

export const ProviderFactory = new InternalProviderFactory()
