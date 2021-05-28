import { Inject, Injectable } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { OAuth2Request } from '../context'
import { InvalidClient } from '../exceptions'
import { OAuth2Client } from '../models'
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
 *     `client_id=client1&client_secret=client1secret`
 *
 * The request's body often comes with more information that may pertain to
 * a specific endpoint or authorization grant. In this case,
 * the body will be similar to the following:
 *
 *     `key1=value1&key2=value2&client_id=client1&client_secret=client1secret`
 *
 * This scheme contains the Client's ID and Secret issued upon creation.
 *
 * The usage of this scheme is **NOT RECOMMENDED** unless the client
 * is unable to use another scheme.
 */
@Injectable()
export class ClientSecretPost implements ClientAuthentication {
  /**
   * Name of the Authentication Method.
   */
  public readonly name: string = 'client_secret_post'

  public constructor(@Inject('Adapter') private readonly adapter: Adapter) {}

  public async authenticate(
    request: OAuth2Request<ClientCredentials>
  ): Promise<OAuth2Client> {
    const { client_id, client_secret } = request.data

    if (!client_id || !client_secret) {
      return undefined
    }

    const client = await this.adapter.findClient(client_id)

    if (!client) {
      throw new InvalidClient({ description: 'Client not found.' })
    }

    if (!client.checkTokenEndpointAuthMethod(this.name)) {
      throw new InvalidClient({
        description: `This Client is not allowed to use the method "${this.name}".`
      })
    }

    if (!client.checkSecret(client_secret)) {
      throw new InvalidClient({
        description: 'Mismatching Client Secret.'
      })
    }

    return client
  }
}
