import { Injectable } from '@guarani/ioc'

import { SupportedPkceMethod } from '../constants'
import { PkceMethod } from './pkce-method'

@Injectable()
export class PlainPkceMethod implements PkceMethod {
  public readonly name: SupportedPkceMethod = 'plain'

  public compare(challenge: string, verifier: string): boolean {
    return challenge === verifier
  }
}
