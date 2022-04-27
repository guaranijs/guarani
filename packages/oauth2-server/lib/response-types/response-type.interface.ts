import { Client } from '../entities/client';
import { User } from '../entities/user';
import { AuthorizationParameters } from '../models/authorization-parameters';
import { AuthorizationResponse } from '../models/authorization-response';
import { ResponseMode } from '../types/response-mode';
import { ResponseType } from '../types/response-type';

/**
 * Interface with the Parameters of a Response Type.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4
 */
export interface IResponseType {
  /**
   * Name of the Response Type.
   */
  readonly name: ResponseType;

  /**
   * Default Response Mode of the Response Type.
   */
  readonly defaultResponseMode: ResponseMode;

  /**
   * Creates the Authorization Response with the Authorization Grant used by the Client on behalf of the End User.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client of the Request.
   * @param user End User represented by the Client.
   * @returns Authorization Response.
   */
  handle(parameters: AuthorizationParameters, client: Client, user: User): Promise<AuthorizationResponse>;
}
