import { randomBytes } from 'crypto';

import { Injectable } from '@guarani/di';
import { AccessTokenServiceInterface } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AccessTokenService implements AccessTokenServiceInterface {
  public async create(scopes: string[], client: Client, user: Nullable<User>): Promise<AccessToken> {
    const now = Date.now();

    const accessToken = AccessToken.create({
      handle: randomBytes(16).toString('hex'),
      scopes,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 3600000),
      validAfter: new Date(now),
      client,
      user,
    });

    await accessToken.save();
    return accessToken;
  }

  public async findOne(handle: string): Promise<Nullable<AccessToken>> {
    return await AccessToken.findOneBy({ handle });
  }

  public async revoke(accessToken: AccessToken): Promise<void> {
    accessToken.isRevoked = true;
    await accessToken.save();
  }
}
