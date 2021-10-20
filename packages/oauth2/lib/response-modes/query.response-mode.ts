import { Injectable } from '@guarani/ioc'
import { Dict } from '@guarani/utils'

import { URL } from 'url'

import { Response } from '../context'
import { ResponseMode } from './response-mode'

/**
 * Definition of Query Response Mode.
 */
@Injectable()
export class QueryResponseMode implements ResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name: string = 'query'

  /**
   * Creates a Redirect Response to the provided Redirect URI that includes
   * the provided data at the URI's query.
   *
   * @param redirectUri URI to where the User-Agent will be redirected to.
   * @param data Data to be included at the Redirect Response.
   * @returns Redirect Response.
   */
  public createResponse(redirectUri: string, data: Dict): Response {
    const url = new URL(redirectUri)

    Object.entries(data).forEach(([name, value]) =>
      url.searchParams.set(name, String(value))
    )

    return new Response().redirect(url)
  }
}
