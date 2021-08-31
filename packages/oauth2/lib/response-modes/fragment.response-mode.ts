import { Dict } from '@guarani/utils'

import { URL, URLSearchParams } from 'url'

import { SupportedResponseMode } from '../constants'
import { RedirectResponse } from '../context'
import { ResponseMode } from './response-mode'

export class FragmentResponseMode implements ResponseMode {
  public readonly name: SupportedResponseMode = 'fragment'

  public createResponse(redirectUri: string, data: Dict): RedirectResponse {
    const url = new URL(redirectUri)
    const params = new URLSearchParams(data)

    url.hash = String(params)

    return new RedirectResponse(url.href)
  }
}
