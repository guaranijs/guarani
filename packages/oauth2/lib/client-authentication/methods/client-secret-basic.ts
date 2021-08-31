import { Injectable } from '@guarani/ioc'

import { SupportedClientAuthentication } from '../../constants'
import { Request } from '../../context'
import { Client } from '../../entities'
import { InvalidClient } from '../../exceptions'
import { ClientAuthentication } from './client-authentication'

/**
 * Implements the Client Authentication via the Basic Authentication workflow.
 *
 * If this workflow is enabled, it will look at the Authorization header
 * for a scheme similar to the following:
 *
 * ```
 *     Basic Y2xpZW50MTpjbGllbnQxc2VjcmV0
 * ```
 *
 * This scheme denotes the type of the flow, which in this case is `Basic`,
 * and the Client Credentials, that is a Base64 encoded string that contains
 * the Credentials in the format `client_id:client_secret`.
 */
@Injectable()
export class ClientSecretBasic extends ClientAuthentication {
  /**
   * Name of the Authentication Method.
   */
  public readonly name: SupportedClientAuthentication = 'client_secret_basic'

  /**
   * Defines the `WWW-Authenticate` header in case of authentication failure.
   */
  private readonly headers = { 'WWW-Authenticate': 'Basic' }

  public async authenticate(request: Request): Promise<Client> {
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

    if (!(await client.checkSecret(client_secret))) {
      throw new InvalidClient({
        description: 'Mismatching Client Secret.',
        headers: this.headers,
        status_code: 401
      })
    }

    if (!client.checkAuthenticationMethod(this.name)) {
      throw new InvalidClient({
        description: `This Client is not allowed to use the method "${this.name}".`,
        headers: this.headers,
        status_code: 401
      })
    }

    return client
  }
}
