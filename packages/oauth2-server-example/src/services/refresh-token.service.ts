import { RefreshTokenService as BaseRefreshTokenService, SupportedGrantType } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';
import { secretToken } from '@guarani/utils';

import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

export class RefreshTokenService implements BaseRefreshTokenService {
  public async createRefreshToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: Client,
    user: User
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken();

    Object.assign<RefreshToken, Partial<RefreshToken>>(refreshToken, {
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

  public async findRefreshToken(token: string): Promise<Optional<RefreshToken>> {
    return (await RefreshToken.findOneBy({ token })) ?? undefined;
  }
}
