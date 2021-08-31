import { Injectable } from '@guarani/ioc'

import { Request as ExpressRequest } from 'express'

import { Request } from '../context'
import { Provider } from './provider'

@Injectable()
export class ExpressProvider extends Provider {
  public createOAuth2Request(request: ExpressRequest): Request {
    return new Request(request)
  }
}
