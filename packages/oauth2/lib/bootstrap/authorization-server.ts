import { Settings } from '../settings'
import { ProviderOptions } from './provider.options'

/**
 * Decorates a Provider to enable it to become an Authorization Server.
 *
 * @param options Defines the parameters of the Authorization Server.
 */
export function AuthorizationServer(options: ProviderOptions): ClassDecorator {
  return function (target) {
    defineMetadata('adapter', options.adapter, target)

    defineMetadata('settings', new Settings(options), target)

    defineMetadata(
      'client-authentication',
      options.clientAuthentication,
      target
    )

    defineMetadata('endpoints', options.endpoints, target)

    defineMetadata('response-modes', options.responseModes, target)

    defineMetadata('grants', options.grants, target)

    defineMetadata('pkce-methods', options.pkceMethods, target)
  }
}

/**
 * Defines the metadata of the Authorization Server.
 *
 * @param key Name of the metadata.
 * @param value Value of the metadata.
 * @param target Decorated Provider.
 */
function defineMetadata(key: string, value: any, target: Function): void {
  Reflect.defineMetadata(`guarani:oauth2:${key}`, value, target)
}
