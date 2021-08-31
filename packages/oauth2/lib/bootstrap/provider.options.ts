import { Constructor } from '@guarani/utils'

import { Adapter } from '../adapter'
import { PkceMethod } from '../pkce'
import { ClientAuthentication } from '../client-authentication'
import { Grant } from '../grants'
import { ResponseMode } from '../response-modes'
import { SettingsParams } from '../settings'

export interface ProviderOptions extends SettingsParams {
  readonly adapter: Adapter
  readonly clientAuthentication?: Constructor<ClientAuthentication>[]
  readonly grants?: Constructor<Grant>[]
  readonly responseModes?: Constructor<ResponseMode>[]
  readonly pkceMethods?: Constructor<PkceMethod>[]
}
