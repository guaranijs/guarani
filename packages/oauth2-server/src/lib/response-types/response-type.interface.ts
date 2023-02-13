import { Consent } from '../entities/consent.entity';
import { AuthorizationResponse } from '../messages/authorization-response';
import { ResponseMode } from '../response-modes/response-mode.type';
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
   * @param consent Consent with the scopes granted by the End User.
   * @returns Authorization Response.
   */
  handle(consent: Consent): Promise<AuthorizationResponse>;
}
