import { AccessTokenService as BaseAccessTokenService, SupportedGrantType } from '@guarani/oauth2-server';
import { secretToken } from '@guarani/utils';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

export class AccessTokenService implements BaseAccessTokenService {
  private readonly grants: Partial<Record<SupportedGrantType, number>> = {
    authorization_code: 86400,
  };

  public async createAccessToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: Client,
    user: User,
    refreshToken: RefreshToken
  ): Promise<AccessToken> {
    const accessToken = new AccessToken();

    Object.assign<AccessToken, Partial<AccessToken>>(accessToken, {
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
