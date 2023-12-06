import { randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { AuthorizationCode } from '../../entities/authorization-code.entity';
import { Consent } from '../../entities/consent.entity';
import { Login } from '../../entities/login.entity';
import { CodeAuthorizationRequest } from '../../requests/authorization/code.authorization-request';
import { AuthorizationCodeServiceInterface } from '../authorization-code.service.interface';

@Injectable()
export class AuthorizationCodeService implements AuthorizationCodeServiceInterface {
  protected readonly authorizationCodes: AuthorizationCode[] = [];

  public constructor() {
    console.warn('Using default Authorization Code Service. This is only recommended for development.');
  }

  public async create(
    parameters: CodeAuthorizationRequest,
    login: Login,
    consent: Consent,
  ): Promise<AuthorizationCode> {
    const now = Date.now();

    const authorizationCode: AuthorizationCode = {
      code: randomUUID(),
      isRevoked: false,
      parameters,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 300000),
      validAfter: new Date(now),
      login,
      consent,
    };

    this.authorizationCodes.push(authorizationCode);

    return authorizationCode;
  }

  public async findOne(code: string): Promise<Nullable<AuthorizationCode>> {
    return this.authorizationCodes.find((authorizationCode) => authorizationCode.code === code) ?? null;
  }

  public async revoke(authorizationCode: AuthorizationCode): Promise<void> {
    authorizationCode.isRevoked = true;
  }
}
