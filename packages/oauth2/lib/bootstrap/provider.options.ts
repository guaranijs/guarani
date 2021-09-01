import { Constructor } from '@guarani/utils'

import { Adapter } from '../adapter'
import { ClientAuthentication } from '../client-authentication'
import { Endpoint } from '../endpoints'
import { Grant } from '../grants'
import { PkceMethod } from '../pkce'
import { ResponseMode } from '../response-modes'
import { SettingsParams } from '../settings'

/**
 * Configuration of the Authorization Server.
 */
export interface ProviderOptions extends SettingsParams {
  /**
   * Application's Adapter containing its logic for the Authorization Server.
   */
  readonly adapter: Adapter

  /**
   * List of Client Authentication Methods.
   */
  readonly clientAuthentication?: Constructor<ClientAuthentication>[]

  /**
   * List of OAuth 2.0 Endpoints.
   */
  readonly endpoints?: Constructor<Endpoint>[]

  /**
   * List of OAuth 2.0 Grants.
   */
  readonly grants?: Constructor<Grant>[]

  /**
   * List of Response Modes for the Authorization Endpoint.
   */
  readonly responseModes?: Constructor<ResponseMode>[]

  /**
   * List of supported PKCE Methods.
   */
  readonly pkceMethods?: Constructor<PkceMethod>[]
}
