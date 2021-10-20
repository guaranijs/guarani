import { Injectable, InjectAll } from '@guarani/ioc'

import { Request, Response } from './context'
import { Endpoint } from './endpoints'

@Injectable()
export abstract class Provider {
  @InjectAll('Endpoint')
  private readonly endpoints: Endpoint[]

  public async endpoint(name: string, request: Request): Promise<Response> {
    const endpoint = this.endpoints.find(endpoint => endpoint.name === name)

    if (!endpoint) {
      throw new Error(`Unsupported Endpoint "${name}".`)
    }

    return await endpoint.handle(request)
  }
}
