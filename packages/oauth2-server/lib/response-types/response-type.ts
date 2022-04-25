import { Dict } from '@guarani/types';

import { Client } from '../entities/client';
import { User } from '../entities/user';
import { SupportedResponseMode } from '../response-modes/types/supported-response-mode';
import { AuthorizationParameters } from './types/authorization.parameters';
import { SupportedResponseType } from './types/supported-response-type';

/**
 * Interface for the Response Types supported by Guarani.
 */
export interface ResponseType {
  /**
   * Name of the Response Type.
   */
  readonly name: SupportedResponseType;

  /**
   * Default Response Mode of the Response Type.
   */
  readonly defaultResponseMode: SupportedResponseMode;

  /**
   * Creates the Authorization Response with the Authorization Grant used by the Client on behalf of the End User.
   *
   * @param params Parameters of the Authorization Request.
   * @param client OAuth 2.0 Client of the Request.
   * @param user End User represented by the Client.
   * @returns Authorization Response.
   */
  createAuthorizationResponse(params: AuthorizationParameters, client: Client, user: User): Promise<Dict>;
}
