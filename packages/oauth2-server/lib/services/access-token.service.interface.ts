import { Optional } from '@guarani/types';

import { AccessToken } from '../entities/access-token';
import { Client } from '../entities/client';
import { User } from '../entities/user';

/**
 * Representation of the Access Token Service.
 *
 * The Access Token Service contains the operations performed by Guarani regarding the OAuth 2.0 Access Token.
 */
export interface IAccessTokenService {
  /**
   * Creates an Access Token for authorized use by the Client on behalf of the End-User.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client requesting authorization.
   * @param user End-User that granted authorization.
   * @returns Issued Access Token.
   */
  createAccessToken(scopes: string[], client: Client, user?: Optional<User>): Promise<AccessToken>;

  /**
   * Searches the application's storage for a Access Token containing the provided Token.
   *
   * @param token Token of the Access Token.
   * @returns Access Token based on the provided Token.
   */
  findAccessToken(token: string): Promise<Optional<AccessToken>>;

  /**
   * Revokes the provided Access Token.
   *
   * @param accessToken Access Token to be revoked.
   */
  revokeAccessToken(accessToken: AccessToken): Promise<void>;
}
