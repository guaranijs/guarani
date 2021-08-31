import { Injectable, InjectAll } from '@guarani/ioc'

import { Request } from '../context'
import { Client } from '../entities'
import { InvalidClient } from '../exceptions'
import { ClientAuthentication } from './methods'

@Injectable()
export class ClientAuthenticator {
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
