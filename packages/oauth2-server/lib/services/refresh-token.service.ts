import { Optional } from '@guarani/types';

import { ClientEntity } from '../entities/client.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserEntity } from '../entities/user.entity';
import { SupportedGrantType } from '../grant-types/types/supported-grant-type';

/**
 * Representation of the Refresh Token Service.
 *
 * The Refresh Token Service contains the operations performed by Guarani that are concerned
 * with the OAuth 2.0 Refresh Token.
 */
export interface RefreshTokenService {
  /**
   * Creates an instance of a Refresh Token.
   *
   * @param grant Grant Type that originated the Refresh Token.
   * @param scopes Scopes granted to the Client.
   * @param client Client of the Request.
   * @param user User that granted authorization to the Client.
   * @returns Instance of a Refresh Token.
   */
  createRefreshToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<RefreshTokenEntity>;

  /**
   * Searches the application's storage for a Refresh Token containing the provided Token.
   *
   * @param token Token of the Refresh Token.
   * @returns Refresh Token based on the provided Token.
   */
  findRefreshToken(token: string): Promise<Optional<RefreshTokenEntity>>;
}
