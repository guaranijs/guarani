import { Nullable, Optional } from '@guarani/types';

import { AccessTokenEntity } from '../entities/access-token.entity';
import { ClientEntity } from '../entities/client.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserEntity } from '../entities/user.entity';
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
    client: ClientEntity,
    user: Nullable<UserEntity>,
    refreshToken?: Optional<RefreshTokenEntity>
  ): Promise<AccessTokenEntity>;
}
