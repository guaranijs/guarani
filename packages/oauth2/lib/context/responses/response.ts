import { OutgoingHttpHeaders } from 'http'

/**
 * Parameters used to populate the Guarani Response.
 */
export interface ResponseParams {
  /**
   * Status Code of the Response.
   */
  readonly statusCode?: number

  /**
   * Headers of the Response.
   */
  readonly headers?: OutgoingHttpHeaders

  /**
   * Body of the Response.
   */
  readonly body?: any
}

/**
 * Implementation of the OAuth 2.0 Response.
 *
 * It has roughly the same attributes and methods of a response of a web framework.
 *
 * It is provided as a framework-agnostic version of the response to allow
 * for multiple integrations without breaking functionality.
 */
export abstract class OAuth2Response {
  /**
   * Status Code of the Response.
   */
  public statusCode: number

  /**
   * Headers of the Response.
   */
  public headers: OutgoingHttpHeaders

  /**
   * Body of the Response.
   */
  public body: Buffer

  /**
   * Instantiates a new Guarani Response based on the provided parameters.
   *
   * @param response - Parameters of the new Response.
   */
  public constructor(response?: ResponseParams) {
    this.statusCode = response?.statusCode ?? 200
    this.headers = response?.headers ?? {}
    this.body = this.parseBody(response?.body)
  }

  /**
   * Parses the body of the Response into a Buffer object.
   *
   * @param body - Object representing the body of the response.
   * @returns Buffer object representing the parsed body.
   */
  protected parseBody(body: any): Buffer {
    return body ? Buffer.from(body) : null
  }
}
