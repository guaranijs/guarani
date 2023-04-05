import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
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
   * @param parameters Parameters of the Authorization Request.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Authorization Response.
   */
  handle(parameters: AuthorizationRequest, session: Session, consent: Consent): Promise<AuthorizationResponse>;
}
