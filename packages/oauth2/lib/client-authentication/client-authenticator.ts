import { Injectable, InjectAll } from '@guarani/ioc'

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

  public async authenticate(request: Request): Promise<Client> {
    for (const method of this.methods) {
      const client = await method.authenticate(request)

      if (!client) {
        continue
      }

      return client
    }

    throw new InvalidClient()
  }
}
