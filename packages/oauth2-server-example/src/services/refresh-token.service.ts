import { IRefreshTokenService } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';
import { secretToken } from '@guarani/utils';

import { ClientEntity } from '../entities/client.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserEntity } from '../entities/user.entity';

export class RefreshTokenService implements IRefreshTokenService {
  public async createRefreshToken(
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<RefreshTokenEntity> {
    const refreshToken = RefreshTokenEntity.create({
      token: await secretToken(16),
      scopes,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + client.refreshTokenLifetime * 1000),
      validAfter: new Date(),
      client,
      user,
    });

    await refreshToken.save();

    return refreshToken;
  }

  public async findRefreshToken(token: string): Promise<Optional<RefreshTokenEntity>> {
    return (await RefreshTokenEntity.findOneBy({ token })) ?? undefined;
  }

  public async revokeRefreshToken(refreshToken: RefreshTokenEntity): Promise<void> {
    refreshToken.isRevoked = true;
    await refreshToken.save();
  }
}
