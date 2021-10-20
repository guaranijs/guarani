import { Dict } from '@guarani/utils'

import { IncomingHttpHeaders } from 'http'

import { User } from '../entities'

/**
 * Parameters used to populate the Guarani Request.
 */
interface RequestParams<T extends Dict> {
  /**
   * Method of the Request.
   */
  readonly method: string

  /**
   * Path of the Request.
   */
  readonly path: string

  /**
   * Parsed Query of the Request.
   */
  readonly query: T

  /**
   * Headers of the Request.
   */
  readonly headers: IncomingHttpHeaders

  /**
   * Cookies of the Request.
   */
  readonly cookies: Dict

  /**
   * Body of the Request.
   */
  readonly body: T

  /**
   * User of the Request.
   */
  readonly user: User
}

/**
 * Implementation of the OAuth 2.0 Request.
 *
 * It has roughly the same attributes and methods of a request of a web framework.
 *
 * It is provided as a framework-agnostic version of the request to allow
 * for multiple integrations without breaking functionality.
 */
export class Request<T extends Dict = Dict> {
  /**
   * Method of the Request.
   */
  public readonly method: string

  /**
   * URL of the Request.
   */
  public readonly path: string

  /**
   * URL of the Request.
   */
  public readonly query: T

  /**
   * Headers of the Request.
   */
  public readonly headers: IncomingHttpHeaders

  /**
   * Cookies of the Request.
   */
  public readonly cookies: Dict

  /**
   * Body of the Request.
   */
  public readonly body: T

  /**
   * Authenticated User of the Request.
   */
  public readonly user?: User

  /**
   * Instantiates a new Guarani Request based on the provided parameters.
   *
   * @param params Parameters of the current Request.
   */
  public constructor(params: RequestParams<T>) {
    this.method = params.method.toLowerCase()
    this.path = params.path
    this.query = <T>(params.query ?? {})
    this.headers = params.headers ?? {}
    this.cookies = params.cookies ?? {}
    this.body = <T>(params.body ?? {})
    this.user = params.user
  }

  /**
   * Returns the Data of the Request from the **Query** and the **Body**
   * based on the Request's Http Method.
   */
  public get data(): T {
    return <T>{
      ...this.query,
      ...(this.method === 'post' ? this.body : {})
    }
  }
}
