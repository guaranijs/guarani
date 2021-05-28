import { Dict } from '@guarani/utils'

import { IncomingHttpHeaders } from 'http'
import { OAuth2User } from '../models'

/**
 * Parameters used to populate the Guarani Request.
 */
export interface RequestParams {
  /**
   * Query parameters of the Request.
   */
  readonly query: Dict<any>

  /**
   * Headers of the Request.
   */
  readonly headers: IncomingHttpHeaders

  /**
   * Body of the Request.
   */
  readonly body: Dict<any>

  /**
   * Authenticated User of the Request.
   */
  readonly user?: OAuth2User
}

/**
 * Implementation of the OAuth 2.0 Request.
 *
 * It has roughly the same attributes and methods of a request of a web framework.
 *
 * It is provided as a framework-agnostic version of the request to allow
 * for multiple integrations without breaking functionality.
 */
export class OAuth2Request<TData = Dict<any>> {
  /**
   * Parsed Query String as a dictionary.
   */
  private readonly _query: Dict<any> = {}

  /**
   * Headers of the Request.
   */
  private readonly _headers: IncomingHttpHeaders

  /**
   * Body of the Request.
   */
  private readonly _body: Dict<any>

  /**
   * Authenticated User of the Request.
   */
  private _user?: OAuth2User

  /**
   * Instantiates a new Guarani Request based on the provided parameters.
   *
   * @param request - Parameters of the current Request.
   */
  public constructor(request: RequestParams) {
    this._query = request.query ?? {}

    this._headers = Object.entries(request.headers).reduce(
      (prev, [key, value]) => {
        prev[key.toLowerCase()] = value
        return prev
      },
      {}
    )

    this._body = request.body ?? {}
    this._user = request.user ?? null
  }

  /**
   * Headers of the Request.
   */
  public get headers(): IncomingHttpHeaders {
    return this._headers
  }

  /**
   * Data of the Request. Obtained by combining the Request's Query and Body.
   */
  public get data(): TData {
    return { ...this._query, ...this._body } as TData
  }

  /**
   * Authenticated User of the Request.
   */
  public get user(): OAuth2User {
    return this._user
  }

  /**
   * Authenticated User of the Request.
   */
  public set user(user: OAuth2User) {
    this._user = user
  }
}
