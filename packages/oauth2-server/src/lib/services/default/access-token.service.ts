import { randomBytes } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { AccessToken } from '../../entities/access-token.entity';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { Logger } from '../../logger/logger';
import { AccessTokenServiceInterface } from '../access-token.service.interface';

@Injectable()
export class AccessTokenService implements AccessTokenServiceInterface {
  protected readonly accessTokens: AccessToken[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Access Token Service. This is only recommended for development.`,
      'cb97e86b-bc91-468f-919e-611df74dcc32',
    );
  }

  public async create(scopes: string[], client: Client, user: Nullable<User>): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, 'ff4cab97-052b-4db7-848e-d3bcf903a303', {
      scopes,
      client,
      user,
    });

    const now = Date.now();

    const accessToken: AccessToken = {
      id: randomBytes(16).toString('hex'),
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
    this.logger.debug(
      `[${this.constructor.name}] Called createInitialAccessToken()`,
      'c39c65e2-26ad-4c2c-9843-10d215edfe4e',
    );

    const now = Date.now();

    const accessToken: AccessToken = {
      id: randomBytes(16).toString('hex'),
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
    this.logger.debug(
      `[${this.constructor.name}] Called createRegistrationAccessToken()`,
      'dc11796b-ad15-4e46-babd-8ff3195046fa',
      { client },
    );

    const now = Date.now();

    const accessToken: AccessToken = {
      id: randomBytes(16).toString('hex'),
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

  public async findOne(id: string): Promise<Nullable<AccessToken>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, '39aad302-c6af-417c-a834-36ad47c12302', { id });
    return this.accessTokens.find((accessToken) => accessToken.id === id) ?? null;
  }

  public async revoke(accessToken: AccessToken): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called revoke()`, '1a7eb712-0163-4fb6-8017-954b920883bc', {
      access_token: accessToken,
    });

    accessToken.isRevoked = true;
  }
}
