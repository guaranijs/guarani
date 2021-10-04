import { Injectable, InjectAll } from '@guarani/ioc'

import { SupportedClientAuthentication } from '../constants'
import { Request } from '../context'
import { Client } from '../entities'
import { OAuth2Error } from '../exception'
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
    const method = this.getRequestedMethod(request, methods)

    return await method.authenticate(request)
  }

  /**
   * Retrieves the requested Client Authentication Method
   * based on the Request parameters.
   *
   * @param request Current Request.
   * @param methods Authentication Methods supported by the endpoint.
   * @returns Authentication Method used by the Client.
   */
  private getRequestedMethod(
    request: Request,
    methods?: SupportedClientAuthentication[]
  ): ClientAuthentication {
    let requestedMethod: ClientAuthentication

    for (const method of this.methods) {
      if (methods != null && !methods.includes(method.name)) {
        continue
      }

      if (method.hasBeenRequested(request)) {
        if (requestedMethod != null) {
          throw OAuth2Error.InvalidClient(
            'Multiple Client Authentication methods detected.'
          )
        }

        requestedMethod = method
      }
    }

    if (!requestedMethod) {
      throw OAuth2Error.InvalidClient('No Authentication Method provided.')
    }

    return requestedMethod
  }
}
