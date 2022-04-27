import { IAccessTokenService } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';
import { secretToken } from '@guarani/utils';

import { AccessTokenEntity } from '../entities/access-token.entity';
import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';

export class AccessTokenService implements IAccessTokenService {
  public async createAccessToken(
    scopes: string[],
    client: ClientEntity,
    user?: Optional<UserEntity>
  ): Promise<AccessTokenEntity> {
    const accessToken = AccessTokenEntity.create({
      token: await secretToken(24),
      tokenType: 'Bearer',
      scopes,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + client.accessTokenLifetime * 1000),
      validAfter: new Date(),
      client,
      user,
    });

    await accessToken.save();

    return accessToken;
  }

  public async findAccessToken(token: string): Promise<Optional<AccessTokenEntity>> {
    return (await AccessTokenEntity.findOneBy({ token })) ?? undefined;
  }

  public async revokeAccessToken(accessToken: AccessTokenEntity): Promise<void> {
    accessToken.isRevoked = true;
    await accessToken.save();
  }
}
