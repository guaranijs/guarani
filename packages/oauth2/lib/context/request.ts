import { Dict } from '@guarani/utils'

import { IncomingHttpHeaders } from 'http'

import { User } from '../entities'

/**
 * Parameters used to populate the Guarani Request.
 */
interface RequestParams {
  /**
   * Method of the Request.
   */
  readonly method: string

  /**
   * Parsed Query of the Request.
   */
  readonly query: Dict

  /**
   * Headers of the Request.
   */
  readonly headers: IncomingHttpHeaders

  /**
   * Body of the Request.
   */
  readonly body: Dict
}

/**
 * Implementation of the OAuth 2.0 Request.
 *
 * It has roughly the same attributes and methods of a request of a web framework.
 *
 * It is provided as a framework-agnostic version of the request to allow
 * for multiple integrations without breaking functionality.
 */
export class Request {
  /**
   * Method of the Request.
   */
  public readonly method: string

  /**
   * URL of the Request.
   */
  public readonly query: Dict

  /**
   * Headers of the Request.
   */
  public readonly headers: IncomingHttpHeaders

  /**
   * Body of the Request.
   */
  public readonly body: Dict

  /**
   * Authenticated User of the Request.
   */
  private _user?: User

  /**
   * Instantiates a new Guarani Request based on the provided parameters.
   *
   * @param params Parameters of the current Request.
   */
  public constructor(params: RequestParams) {
    this.method = params.method.toLowerCase()
    this.query = params.query ?? {}
    this.headers = params.headers ?? {}
    this.body = params.body ?? {}
  }

  /**
   * Data of the Request. Obtained by combining the Request's Query and Body.
   */
  public get data(): Dict {
    return { ...this.query, ...this.body }
  }

  /**
   * Authenticated User of the Request.
   */
  public get user(): User {
    return this._user
  }

  /**
   * Authenticated User of the Request.
   */
  public set user(user: User) {
    if (this._user != null) {
      throw new Error('User already set on the Request.')
    }

    this._user = user
  }
}
