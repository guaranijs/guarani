import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { randomBytes } from 'crypto';

import { AccessToken } from '../../entities/access-token.entity';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { AccessTokenServiceInterface } from '../access-token.service.interface';

@Injectable()
export class AccessTokenService implements AccessTokenServiceInterface {
  protected readonly accessTokens: AccessToken[] = [];

  public constructor() {
    console.warn('Using default Access Token Service. This is only recommended for development.');
  }

  public async create(scopes: string[], client: Client, user: Nullable<User>): Promise<AccessToken> {
    const now = Date.now();

    const accessToken: AccessToken = {
      handle: randomBytes(16).toString('hex'),
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

  public async createInitialAccessToken(): Promise<AccessToken> {
    const now = Date.now();

    const accessToken: AccessToken = {
      handle: randomBytes(16).toString('hex'),
      scopes: ['client:create'],
      isRevoked: false,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 300000),
      validAfter: new Date(now),
      client: null,
      user: null,
    };

    this.accessTokens.push(accessToken);

    return accessToken;
  }

  public async createRegistrationAccessToken(client: Client): Promise<AccessToken> {
    const now = Date.now();

    const accessToken: AccessToken = {
      handle: randomBytes(16).toString('hex'),
      scopes: ['client:manage'],
      isRevoked: false,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 86400000),
      validAfter: new Date(now),
      client,
      user: null,
    };

    this.accessTokens.push(accessToken);

    return accessToken;
  }

  public async findOne(handle: string): Promise<Nullable<AccessToken>> {
    return this.accessTokens.find((accessToken) => accessToken.handle === handle) ?? null;
  }

  public async revoke(accessToken: AccessToken): Promise<void> {
    accessToken.isRevoked = true;
  }
}
