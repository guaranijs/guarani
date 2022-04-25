import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token';
import { Client } from '../entities/client';
import { RefreshToken } from '../entities/refresh-token';
import { User } from '../entities/user';
import { SupportedGrantType } from '../grant-types/types/supported-grant-type';

/**
 * Representation of the Access Token Service.
 *
 * The Access Token Service contains the operations performed by Guarani that are concerned
 * with the OAuth 2.0 Access Token.
 */
export interface AccessTokenService {
  /**
   * Creates an instance of an Access Token.
   *
   * @param grant Grant Type that originated the Access Token.
   * @param scopes Scopes granted to the Client.
   * @param client Client of the Request.
   * @param user User that granted authorization to the Client.
   * @param refreshToken Refresh Token that generated the Access Token.
   * @returns Instance of an Access Token.
   */
  createAccessToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: Client,
    user: Nullable<User>,
    refreshToken: Nullable<RefreshToken>
  ): Promise<AccessToken>;
}
