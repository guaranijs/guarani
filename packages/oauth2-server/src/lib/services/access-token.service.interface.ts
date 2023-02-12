import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';

/**
 * Interface of the Access Token Service.
 *
 * The Access Token Service contains the operations regarding the OAuth 2.0 Access Token.
 */
export interface AccessTokenServiceInterface {
  /**
   * Creates an Access Token for authorized use by the Client on behalf of the End-User.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client requesting authorization.
   * @param user End-User that granted authorization.
   * @returns Issued Access Token.
   */
  create(scopes: string[], client: Client, user?: User): Promise<AccessToken>;

  /**
   * Searches the application's storage for a Access Token containing the provided Handle.
   *
   * @param handle Handle of the Access Token.
   * @returns Access Token based on the provided Handle.
   */
  findOne(handle: string): Promise<AccessToken | null>;

  /**
   * Revokes the provided Access Token.
   *
   * @param accessToken Access Token to be revoked.
   */
  revoke(accessToken: AccessToken): Promise<void>;
}