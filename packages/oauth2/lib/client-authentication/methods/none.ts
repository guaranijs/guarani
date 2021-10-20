import { Injectable } from '@guarani/ioc'

import { Request } from '../../context'
import { InvalidClient } from '../../exceptions'
import { Client } from '../../entities'
import { ClientAuthentication } from './client-authentication'

/**
 * Interface of the parameters expected from the POST body.
 */
interface ClientCredentials {
  /**
   * ID of the Client.
   */
  readonly client_id: string

  /**
   * Secret of the Client.
   */
  readonly client_secret?: string
}

/**
 * Implements the Client Authentication via the Body of the Request.
 *
 * If this workflow is enabled, it will look at the body of the request
 * for a scheme similar to the following:
 *
 * ```
 *     client_id=client1
 * ```
 *
 * The request's body often comes with more information that may pertain to
 * a specific endpoint or authorization grant. In this case,
 * the body will be similar to the following:
 *
 * ```
 *     key1=value1&key2=value2&client_id=client1
 * ```
 *
 * In this workflow, if the client provides a client_secret,
 * it will automatically fail, since it is intended to be used by public clients.
 */
@Injectable()
export class None extends ClientAuthentication {
  /**
   * Name of the Authentication Method.
   */
  public readonly name: string = 'none'

  /**
   * Checks if the current Client Authentication Method
   * has been requested by the Client.
   *
   * @param request Current Request.
   */
  public hasBeenRequested(request: Request): boolean {
    const { client_id, client_secret } = <ClientCredentials>request.data

    return client_id != null && client_secret == null
  }

  public async authenticate(request: Request): Promise<Client> {
    const { client_id, client_secret } = <ClientCredentials>request.data

    const client = await this.adapter.findClient(client_id)

    if (!client) {
      throw new InvalidClient('Invalid Credentials.')
    }

    if (client_secret) {
      throw new InvalidClient(
        `A Client with a secret cannot use the method "${this.name}".`
      )
    }

    if (!client.checkAuthenticationMethod(this.name)) {
      throw new InvalidClient(
        `This Client is not allowed to use the method "${this.name}".`
      )
    }

    return client
  }
}
