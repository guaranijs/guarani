import { Injectable } from '@guarani/di';
import { RefreshTokenServiceInterface } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { randomBytes } from 'crypto';

import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class RefreshTokenService implements RefreshTokenServiceInterface {
  public async create(scopes: string[], client: Client, user: User): Promise<RefreshToken> {
    const now = Date.now();

    const refreshToken = RefreshToken.create({
      handle: randomBytes(12).toString('hex'),
      scopes,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 3600000),
      validAfter: new Date(now),
      client,
      user,
    });

    await refreshToken.save();
    return refreshToken;
  }

  public async findOne(handle: string): Promise<Nullable<RefreshToken>> {
    return await RefreshToken.findOneBy({ handle });
  }

  public async revoke(refreshToken: RefreshToken): Promise<void> {
    refreshToken.isRevoked = true;
    await refreshToken.save();
  }
}
