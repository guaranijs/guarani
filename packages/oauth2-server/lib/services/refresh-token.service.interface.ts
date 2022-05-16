import { Optional } from '@guarani/types';

import { Client } from '../entities/client';
import { RefreshToken } from '../entities/refresh-token';
import { User } from '../entities/user';

/**
 * Representation of the Refresh Token Service.
 *
 * The Refresh Token Service contains the operations performed by Guarani regarding the OAuth 2.0 Refresh Token.
 */
export interface IRefreshTokenService {
  /**
   * Creates a Refresh Token for reissuing Access Tokens for authorized use by the Client on behalf of the End-User.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client requesting authorization.
   * @param user End-User that granted authorization.
   * @returns Issued Refresh Token.
   */
  createRefreshToken(scopes: string[], client: Client, user: User): Promise<RefreshToken>;

  /**
   * Searches the application's storage for a Refresh Token containing the provided Token.
   *
   * @param token Token of the Refresh Token.
   * @returns Refresh Token based on the provided Token.
   */
  findRefreshToken(token: string): Promise<Optional<RefreshToken>>;

  /**
   * Revokes the provided Refresh Token.
   *
   * @param refreshToken Refresh Token to be revoked.
   */
  revokeRefreshToken(refreshToken: RefreshToken): Promise<void>;
}
