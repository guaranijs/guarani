import { AccessTokenService as BaseAccessTokenService, SupportedGrantType } from '@guarani/oauth2-server';
import { secretToken } from '@guarani/utils';

import { AccessTokenEntity } from '../entities/access-token.entity';
import { ClientEntity } from '../entities/client.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserEntity } from '../entities/user.entity';

export class AccessTokenService implements BaseAccessTokenService {
  private readonly grants: Partial<Record<SupportedGrantType, number>> = {
    authorization_code: 86400,
  };

  public async createAccessToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity,
    refreshToken: RefreshTokenEntity
  ): Promise<AccessTokenEntity> {
    const accessToken = new AccessTokenEntity();

    Object.assign<AccessTokenEntity, Partial<AccessTokenEntity>>(accessToken, {
      token: await secretToken(24),
      tokenType: 'Bearer',
      scopes,
      isRevoked: false,
      expiresAt: new Date(Date.now() + this.grants[grant]! * 1000),
      client,
      user,
      refreshToken,
    });

    await accessToken.save();

    return accessToken;
  }
}
