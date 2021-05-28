import { Inject, Injectable } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { OAuth2Request } from '../context'
import { InvalidClient } from '../exceptions'
import { OAuth2Client } from '../models'
import { ClientAuthentication } from './client-authentication'

/**
 * Implements the Client Authentication via the Basic Authentication workflow.
 *
 * If this workflow is enabled, it will look at the Authorization header
 * for a scheme similar to the following:
 *
 *     `Basic Y2xpZW50MTpjbGllbnQxc2VjcmV0`
 *
 * This scheme denotes the type of the flow, which in this case is `Basic`,
 * and the Client Credentials, that is a Base64 encoded string that contains
 * the Credentials in the format `client_id:client_secret`.
 */
@Injectable()
export class ClientSecretBasic implements ClientAuthentication {
  /**
   * Name of the Authentication Method.
   */
  public readonly name: string = 'client_secret_basic'

  /**
   * Defines the `WWW-Authenticate` header in case of authentication failure.
   */
  private readonly headers = { 'WWW-Authenticate': 'Basic' }

  public constructor(@Inject('Adapter') private readonly adapter: Adapter) {}

  public async authenticate(request: OAuth2Request): Promise<OAuth2Client> {
    const { authorization } = request.headers

    if (!authorization || !authorization.includes(' ')) {
      return undefined
    }

    const [method, token] = authorization.split(' ', 2)

    if (method.toLowerCase() !== 'basic') {
      return undefined
    }

    if (!token) {
      throw new InvalidClient({ description: 'Missing client credentials.' })
    }

    const credentials = Buffer.from(token, 'base64').toString('utf8')

    if (!credentials || !credentials.includes(':')) {
      throw new InvalidClient({
        description: 'Invalid credentials at the Authorization header.',
        headers: this.headers,
        status_code: 401
      })
    }

    const [client_id, client_secret] = credentials.split(':', 2)

    if (!client_id || !client_secret) {
      throw new InvalidClient({
        description: 'Invalid credentials at the Authorization header.',
        headers: this.headers,
        status_code: 401
      })
    }

    const client = await this.adapter.findClient(client_id)

    if (!client) {
      throw new InvalidClient({
        description: 'Client not found.',
        headers: this.headers,
        status_code: 401
      })
    }

    if (!client.checkTokenEndpointAuthMethod(this.name)) {
      throw new InvalidClient({
        description: `This Client is not allowed to use the method "${this.name}".`,
        headers: this.headers,
        status_code: 401
      })
    }

    if (!client.checkSecret(client_secret)) {
      throw new InvalidClient({
        description: 'Mismatching Client Secret.',
        headers: this.headers,
        status_code: 401
      })
    }

    return client
  }
}
