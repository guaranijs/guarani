import { Injectable } from '@guarani/ioc'

import { timingSafeEqual } from 'crypto'

import { SupportedClientAuthentication } from '../../constants'
import { Request } from '../../context'
import { OAuth2Error } from '../../exception'
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
  readonly client_secret: string
}

/**
 * Implements the Client Authentication via the Body Post workflow.
 *
 * If this workflow is enabled, it will look at the Body of the request
 * for a scheme similar to the following:
 *
 * ```
 *     client_id=client1&client_secret=client1secret
 * ```
 *
 * The request's body often comes with more information that may pertain to
 * a specific endpoint or authorization grant. In this case,
 * the body will be similar to the following:
 *
 * ```
 *     key1=value1&key2=value2&client_id=client1&client_secret=client1secret
 * ```
 *
 * This scheme contains the Client's ID and Secret issued upon creation.
 *
 * The usage of this scheme is **NOT RECOMMENDED** unless the client
 * is unable to use another scheme.
 */
@Injectable()
export class ClientSecretPost extends ClientAuthentication {
  /**
   * Name of the Authentication Method.
   */
  public readonly name = SupportedClientAuthentication.ClientSecretPost

  /**
   * Checks if the current Client Authentication Method
   * has been requested by the Client.
   *
   * @param request Current Request.
   */
  public hasBeenRequested(request: Request): boolean {
    const { client_id, client_secret } = <ClientCredentials>request.data

    return client_id != null && client_secret != null
  }

  public async authenticate(request: Request): Promise<Client> {
    const { client_id, client_secret } = <ClientCredentials>request.data

    const client = await this.adapter.findClient(client_id)

    if (!client) {
      throw OAuth2Error.InvalidClient('Invalid Credentials.')
    }

    const clientSecret = Buffer.from(await client.getClientSecret())
    const providedSecret = Buffer.from(client_secret)

    if (!timingSafeEqual(clientSecret, providedSecret)) {
      throw OAuth2Error.InvalidClient('Invalid Credentials.')
    }

    if (!client.checkAuthenticationMethod(this.name)) {
      throw OAuth2Error.InvalidClient(
        `This Client is not allowed to use the method "${this.name}".`
      )
    }

    return client
  }
}
