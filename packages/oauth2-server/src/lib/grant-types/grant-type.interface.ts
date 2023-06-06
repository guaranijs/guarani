import { TokenContext } from '../context/token/token-context';
import { TokenResponse } from '../responses/token-response';
import { GrantType } from './grant-type.type';

/**
 * Interface of a Grant Type.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4
 */
export interface GrantTypeInterface {
  /**
   * Name of the Grant Type.
   */
  readonly name: GrantType;

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * @param context Token Request Context.
   * @returns Access Token Response.
   */
  handle(context: TokenContext): Promise<TokenResponse>;
}
