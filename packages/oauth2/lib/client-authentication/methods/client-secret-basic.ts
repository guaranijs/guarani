import { Injectable } from '@guarani/ioc'

import { timingSafeEqual } from 'crypto'

import { SupportedClientAuthentication } from '../../constants'
import { Request } from '../../context'
import { Client } from '../../entities'
import { OAuth2Error } from '../../exception'
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

  /**
   * Checks if the current Client Authentication Method
   * has been requested by the Client.
   *
   * @param request Current Request.
   */
  public hasBeenRequested(request: Request): boolean {
    const { authorization } = request.headers

    if (!authorization || !authorization.includes(' ')) {
      return false
    }

    const [method] = authorization.split(' ', 2)

    if (method.toLowerCase() !== 'basic') {
      return false
    }

    return true
  }

  public async authenticate(request: Request): Promise<Client> {
    const { authorization } = request.headers

    const [, token] = authorization.split(' ', 2)

    if (!token) {
      throw OAuth2Error.InvalidClient('Missing Client Credentials.')
    }

    const credentials = Buffer.from(token, 'base64').toString('utf8')

    if (!credentials || !credentials.includes(':')) {
      throw OAuth2Error.InvalidClient(
        'Invalid Credentials at the Authorization header.'
      )
        .status(401)
        .setHeaders(this.headers)
    }

    const [client_id, client_secret] = credentials.split(':', 2)

    if (!client_id || !client_secret) {
      throw OAuth2Error.InvalidClient(
        'Invalid Credentials at the Authorization header.'
      )
        .status(401)
        .setHeaders(this.headers)
    }

    const client = await this.adapter.findClient(client_id)

    if (!client) {
      throw OAuth2Error.InvalidClient('Invalid Credentials.')
        .status(401)
        .setHeaders(this.headers)
    }

    const clientSecret = Buffer.from(await client.getClientSecret())
    const providedSecret = Buffer.from(client_secret)

    if (!timingSafeEqual(clientSecret, providedSecret)) {
      throw OAuth2Error.InvalidClient('Invalid Credentials.')
        .status(401)
        .setHeaders(this.headers)
    }

    if (!client.checkAuthenticationMethod(this.name)) {
      throw OAuth2Error.InvalidClient(
        `This Client is not allowed to use the method "${this.name}".`
      )
        .status(401)
        .setHeaders(this.headers)
    }

    return client
  }
}
