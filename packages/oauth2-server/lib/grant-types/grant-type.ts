import { ClientEntity } from '../entities/client.entity';
import { Request } from '../http/request';
import { AccessTokenResponse } from '../types/access-token.response';
import { SupportedGrantType } from './types/supported-grant-type';

/**
 * Interface for the Grant Types supported by Guarani.
 */
export interface GrantType {
  /**
   * Name of the Grant Type.
   */
  readonly name: SupportedGrantType;

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @returns Access Token Response.
   */
  createTokenResponse(request: Request, client: ClientEntity): Promise<AccessTokenResponse>;
}
