import { Dict } from '@guarani/utils'

import { Response } from '../context'

/**
 * Definition of a Response Mode for Redirect Responses.
 */
export interface ResponseMode {
  /**
   * Name of the Response Mode.
   */
  readonly name: string

  /**
   * Creates a Redirect Response to the provided Redirect URI containing
   * the provided data.
   *
   * @param redirectUri URI to where the User-Agent will be redirected to.
   * @param data Data to be included at the Redirect Response.
   * @returns Redirect Response.
   */
  createResponse(redirectUri: string, data: Dict): Response
}
