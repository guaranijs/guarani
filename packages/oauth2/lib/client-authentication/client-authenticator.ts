import { Injectable, InjectAll } from '@guarani/ioc'

import { SupportedClientAuthentication } from '../constants'
import { Request } from '../context'
import { Client } from '../entities'
import { InvalidClient } from '../exceptions'
import { ClientAuthentication } from './methods'

/**
 * Implementation of a Client Authenticator.
 *
 * It uses the Client Authentication Methods requested by the application and
 * detects the usage of multiple Client Authentication Methods.
 */
@Injectable()
export class ClientAuthenticator {
  /**
   * Instantiates a new Client Authenticator.
   *
   * @param methods Client Authentication Methods requested by the application.
   */
  public constructor(
    @InjectAll('ClientAuthentication')
    private readonly methods: ClientAuthentication[]
  ) {}

  /**
   * Authenticates the Client of the Request based on the Authentication Methods
   * supported by the Authorization Server, as well as the Methods supported by
   * the respective endpoint requesting the authentication.
   *
   * @param request Current request.
   * @param methods Authentication Methods supported by the endpoint.
   * @returns Authenticated Client.
   */
  public async authenticate(
    request: Request,
    methods?: SupportedClientAuthentication[]
  ): Promise<Client> {
    for (const method of this.methods) {
      if (methods != null && !methods.includes(method.name)) {
        continue
      }

      const client = await method.authenticate(request)

      if (!client) {
        continue
      }

      return client
    }

    throw new InvalidClient()
  }
}
