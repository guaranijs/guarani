import { Client } from '../entities/client';
import { TokenParameters } from '../models/token-parameters';
import { TokenResponse } from '../models/token-response';
import { GrantType } from '../types/grant-type';

/**
 * Interface with the Parameters of a Grant Type.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4
 */
export interface IGrantType {
  /**
   * Name of the Grant Type.
   */
  readonly name: GrantType;

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Access Token Response.
   */
  handle(parameters: TokenParameters, client: Client): Promise<TokenResponse>;
}
