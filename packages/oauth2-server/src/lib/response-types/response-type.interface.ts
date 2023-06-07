import { AuthorizationContext } from '../context/authorization/authorization-context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { ResponseMode } from '../response-modes/response-mode.type';
import { AuthorizationResponse } from '../responses/authorization/authorization-response';
import { ResponseType } from './response-type.type';

/**
 * Interface of a Response Type.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4
 */
export interface ResponseTypeInterface {
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
   * @param context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Authorization Response.
   */
  handle(context: AuthorizationContext, login: Login, consent: Consent): Promise<AuthorizationResponse>;
}
