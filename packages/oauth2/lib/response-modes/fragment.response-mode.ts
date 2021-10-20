import { Injectable } from '@guarani/ioc'
import { Dict } from '@guarani/utils'

import { URL, URLSearchParams } from 'url'

import { SupportedResponseMode } from '../constants'
import { RedirectResponse } from '../context'
import { ResponseMode } from './response-mode'

/**
 * Definition of the Fragment Response Mode.
 */
@Injectable()
export class FragmentResponseMode implements ResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name = SupportedResponseMode.Fragment

  /**
   * Creates a Redirect Response to the provided Redirect URI that includes
   * the provided data at the URI's fragment.
   *
   * @param redirectUri URI to where the User-Agent will be redirected to.
   * @param data Data to be included at the Redirect Response.
   * @returns Redirect Response.
   */
  public createResponse(redirectUri: string, data: Dict): RedirectResponse {
    const url = new URL(redirectUri)
    const params = new URLSearchParams(data)

    url.hash = String(params)

    return new RedirectResponse(url.href)
  }
}
