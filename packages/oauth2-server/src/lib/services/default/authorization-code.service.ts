import { Injectable } from '@guarani/di';

import { randomUUID } from 'crypto';

import { AuthorizationCode } from '../../entities/authorization-code.entity';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { CodeAuthorizationRequest } from '../../messages/code.authorization-request';
import { AuthorizationCodeServiceInterface } from '../authorization-code.service.interface';

@Injectable()
export class AuthorizationCodeService implements AuthorizationCodeServiceInterface {
  protected readonly authorizationCodes: AuthorizationCode[] = [];

  public constructor() {
    console.warn('Using default Authorization Code Service. This is only recommended for development.');
  }

  public async create(parameters: CodeAuthorizationRequest, client: Client, user: User): Promise<AuthorizationCode> {
    const now = Date.now();

    const authorizationCode: AuthorizationCode = {
      code: randomUUID(),
      scopes: parameters.scope.split(' '),
      redirectUri: parameters.redirect_uri,
      codeChallenge: parameters.code_challenge,
      codeChallengeMethod: parameters.code_challenge_method ?? 'plain',
      isRevoked: false,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 300000),
      validAfter: new Date(now),
      client,
      user,
    };

    this.authorizationCodes.push(authorizationCode);

    return authorizationCode;
  }

  public async findOne(code: string): Promise<AuthorizationCode | null> {
    return this.authorizationCodes.find((authorizationCode) => authorizationCode.code === code) ?? null;
  }

  public async revoke(authorizationCode: AuthorizationCode): Promise<void> {
    authorizationCode.isRevoked = true;
  }
}
