import { Dict } from '@guarani/types';

import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';
import { Request } from '../http/request';
import { SupportedResponseMode } from '../response-modes/types/supported-response-mode';
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
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @param user End User represented by the Client.
   * @returns Authorization Response.
   */
  createAuthorizationResponse(request: Request, client: ClientEntity, user: UserEntity): Promise<Dict>;
}
