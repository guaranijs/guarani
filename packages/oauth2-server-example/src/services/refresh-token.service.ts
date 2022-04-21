import { RefreshTokenService as BaseRefreshTokenService, SupportedGrantType } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';
import { secretToken } from '@guarani/utils';

import { ClientEntity } from '../entities/client.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserEntity } from '../entities/user.entity';

export class RefreshTokenService implements BaseRefreshTokenService {
  public async createRefreshToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<RefreshTokenEntity> {
    const refreshToken = new RefreshTokenEntity();

    Object.assign<RefreshTokenEntity, Partial<RefreshTokenEntity>>(refreshToken, {
      token: await secretToken(16),
      scopes,
      grant,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 14),
      client,
      user,
    });

    await refreshToken.save();

    return refreshToken;
  }

  public async findRefreshToken(token: string): Promise<Optional<RefreshTokenEntity>> {
    return (await RefreshTokenEntity.findOneBy({ token })) ?? undefined;
  }
}
