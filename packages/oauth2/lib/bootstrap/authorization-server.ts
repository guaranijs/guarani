import { Settings } from '../settings'
import { ProviderOptions } from './provider.options'

export function AuthorizationServer(options: ProviderOptions): ClassDecorator {
  return function (target) {
    defineMetadata('adapter', options.adapter, target)

    defineMetadata('settings', new Settings(options), target)

    defineMetadata(
      'client-authentication',
      options.clientAuthentication,
      target
    )

    defineMetadata('response-modes', options.responseModes, target)

    defineMetadata('grants', options.grants, target)

    defineMetadata('pkce-methods', options.pkceMethods, target)
  }
}

function defineMetadata(key: string, value: any, target: Function): void {
  Reflect.defineMetadata(`guarani:oauth2:${key}`, value, target)
}
