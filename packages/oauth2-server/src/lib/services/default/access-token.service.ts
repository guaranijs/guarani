import { Injectable } from '@guarani/di';

import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { AccessToken } from '../../entities/access-token.entity';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { AccessTokenServiceInterface } from '../access-token.service.interface';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class AccessTokenService implements AccessTokenServiceInterface {
  protected readonly accessTokens: AccessToken[] = [];

  public constructor() {
    console.warn('Using default Access Token Service. This is only recommended for development.');
  }

  public async create(scopes: string[], client: Client, user?: User): Promise<AccessToken> {
    const now = Date.now();

    const accessToken: AccessToken = {
      handle: (await randomBytesAsync(16)).toString('hex'),
      scopes,
      isRevoked: false,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 3600000),
      validAfter: new Date(now),
      client,
      user,
    };

    this.accessTokens.push(accessToken);

    return accessToken;
  }

  public async findOne(handle: string): Promise<AccessToken | null> {
    return this.accessTokens.find((accessToken) => accessToken.handle === handle) ?? null;
  }

  public async revoke(accessToken: AccessToken): Promise<void> {
    accessToken.isRevoked = true;
  }
}
