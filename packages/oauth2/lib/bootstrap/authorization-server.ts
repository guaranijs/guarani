import { Settings } from '../settings'
import { ProviderOptions } from './provider.options'

/**
 * Decorates a Provider to enable it to become an Authorization Server.
 *
 * @param options Defines the parameters of the Authorization Server.
 */
export function AuthorizationServer(options: ProviderOptions): ClassDecorator {
  return function (target) {
    Reflect.defineMetadata('guarani:oauth2:adapter', options.adapter, target)

    Reflect.defineMetadata(
      'guarani:oauth2:settings',
      new Settings(options),
      target
    )

    Reflect.defineMetadata(
      'guarani:oauth2:client-authentication',
      options.clientAuthentication,
      target
    )

    Reflect.defineMetadata(
      'guarani:oauth2:endpoints',
      options.endpoints,
      target
    )

    Reflect.defineMetadata(
      'guarani:oauth2:response-modes',
      options.responseModes,
      target
    )

    Reflect.defineMetadata('guarani:oauth2:grants', options.grants, target)

    Reflect.defineMetadata(
      'guarani:oauth2:pkce-methods',
      options.pkceMethods,
      target
    )
  }
}
