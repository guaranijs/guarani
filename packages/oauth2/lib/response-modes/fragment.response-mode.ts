import { Injectable } from '@guarani/ioc'
import { Dict } from '@guarani/utils'

import { URL, URLSearchParams } from 'url'

import { Response } from '../context'
import { ResponseMode } from './response-mode'

/**
 * Definition of the Fragment Response Mode.
 */
@Injectable()
export class FragmentResponseMode implements ResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name: string = 'fragment'

  /**
   * Creates a Redirect Response to the provided Redirect URI that includes
   * the provided data at the URI's fragment.
   *
   * @param redirectUri URI to where the User-Agent will be redirected to.
   * @param data Data to be included at the Redirect Response.
   * @returns Redirect Response.
   */
  public createResponse(redirectUri: string, data: Dict): Response {
    const url = new URL(redirectUri)
    const params = new URLSearchParams(data)

    url.hash = String(params)

    return new Response().redirect(url)
  }
}
