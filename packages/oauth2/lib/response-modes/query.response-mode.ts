import { Dict } from '@guarani/utils'

import { URL } from 'url'

import { SupportedResponseMode } from '../constants'
import { RedirectResponse } from '../context'
import { ResponseMode } from './response-mode'

export class QueryResponseMode implements ResponseMode {
  public readonly name: SupportedResponseMode = 'query'

  public createResponse(redirectUri: string, data: Dict): RedirectResponse {
    const url = new URL(redirectUri)

    Object.entries(data).forEach(([name, value]) =>
      url.searchParams.set(name, String(value))
    )

    return new RedirectResponse(url.href)
  }
}
