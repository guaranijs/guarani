import { randomBytes } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { User } from '../../entities/user.entity';
import { Logger } from '../../logger/logger';
import { RefreshTokenServiceInterface } from '../refresh-token.service.interface';

@Injectable()
export class RefreshTokenService implements RefreshTokenServiceInterface {
  protected readonly refreshTokens: RefreshToken[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Refresh Token Service. This is only recommended for development.`,
      '6a844247-edbf-4257-ad1a-6bfa7e7dcd84',
    );
  }

  public async create(scopes: string[], client: Client, user: User): Promise<RefreshToken> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, '3faa0098-fec4-497c-8c87-f1ded464089b', {
      scopes,
      client,
      user,
    });

    const now = Date.now();

    const refreshToken: RefreshToken = {
      id: randomBytes(12).toString('hex'),
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

  public async findOne(id: string): Promise<Nullable<RefreshToken>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, '7b1685c4-a6c5-48b3-9874-cf938ad6f647', { id });
    return this.refreshTokens.find((refreshToken) => refreshToken.id === id) ?? null;
  }

  public async revoke(refreshToken: RefreshToken): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called revoke()`, 'e1191255-5a1a-4d56-9af5-bc745e9683b7', {
      refresh_token: refreshToken,
    });

    refreshToken.isRevoked = true;
  }

  public async rotate(refreshToken: RefreshToken): Promise<RefreshToken> {
    this.logger.debug(`[${this.constructor.name}] Called rotate()`, 'e0a12195-9a3e-4f70-a16c-f22ea912c88c', {
      refresh_token: refreshToken,
    });

    const now = Date.now();

    const newRefreshToken: RefreshToken = {
      id: randomBytes(12).toString('hex'),
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
