import { Constructor } from '@guarani/utils'

import { Adapter } from '../adapter'
import { ClientAuthentication } from '../authentication'
import { Endpoint } from '../endpoints'
import { Grant } from '../grants'
import { Settings, SettingsParams } from '../settings'

interface Options extends SettingsParams {
  readonly adapter: Adapter
  readonly clientAuthentication?: Constructor<ClientAuthentication>[]
  readonly endpoints?: Constructor<Endpoint>[]
  readonly grants?: Constructor<Grant>[]
}

export function AuthorizationServer(options: Options): ClassDecorator {
  return function (target) {
    defineMetadata('adapter', options.adapter, target)

    defineMetadata('settings', new Settings(options), target)

    defineMetadata(
      'client-authentication',
      options.clientAuthentication,
      target
    )

    defineMetadata('endpoints', options.endpoints, target)

    defineMetadata('grants', options.grants, target)
  }
}

function defineMetadata(key: string, value: any, target: Function): void {
  Reflect.defineMetadata(`guarani:oidc:${key}`, value, target)
}
