import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { Client } from '../../entities/client.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { User } from '../../entities/user.entity';
import { RefreshTokenServiceInterface } from '../refresh-token.service.interface';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class RefreshTokenService implements RefreshTokenServiceInterface {
  protected readonly refreshTokens: RefreshToken[] = [];

  public constructor() {
    console.warn('Using default Refresh Token Service. This is only recommended for development.');
  }

  public async create(scopes: string[], client: Client, user: User): Promise<RefreshToken> {
    const now = Date.now();

    const refreshToken: RefreshToken = {
      handle: (await randomBytesAsync(12)).toString('hex'),
      scopes,
      isRevoked: false,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 86400000),
      validAfter: new Date(now),
      client,
      user,
    };

    this.refreshTokens.push(refreshToken);

    return refreshToken;
  }

  public async findOne(handle: string): Promise<Nullable<RefreshToken>> {
    return this.refreshTokens.find((refreshToken) => refreshToken.handle === handle) ?? null;
  }

  public async revoke(refreshToken: RefreshToken): Promise<void> {
    refreshToken.isRevoked = true;
  }

  public async rotate(refreshToken: RefreshToken): Promise<RefreshToken> {
    const now = Date.now();

    const newRefreshToken: RefreshToken = {
      handle: (await randomBytesAsync(12)).toString('hex'),
      scopes: refreshToken.scopes,
      isRevoked: false,
      issuedAt: new Date(now),
      expiresAt: refreshToken.expiresAt,
      validAfter: new Date(now),
      client: refreshToken.client,
      user: refreshToken.user,
    };

    this.refreshTokens.push(newRefreshToken);

    await this.revoke(refreshToken);

    return newRefreshToken;
  }
}
