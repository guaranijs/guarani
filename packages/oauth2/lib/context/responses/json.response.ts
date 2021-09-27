import { Dict } from '@guarani/utils'

import { Response } from './response'

/**
 * Implementation of a JSON Http Response.
 */
export class JsonResponse<T extends Dict> extends Response {
  /**
   * Instantiates a new Http Response with the provided data as its Body.
   *
   * @param data JSON data to be used as the Http Response's Body.
   */
  public constructor(data: T) {
    super()

    this._headers['Content-Type'] = 'application/json'
    this._body = Buffer.from(JSON.stringify(data ?? null))
  }
}
