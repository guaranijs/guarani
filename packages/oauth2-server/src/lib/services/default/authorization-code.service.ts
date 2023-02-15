import { Injectable } from '@guarani/di';

import { randomUUID } from 'crypto';

import { AuthorizationCode } from '../../entities/authorization-code.entity';
import { Consent } from '../../entities/consent.entity';
import { AuthorizationCodeServiceInterface } from '../authorization-code.service.interface';

@Injectable()
export class AuthorizationCodeService implements AuthorizationCodeServiceInterface {
  protected readonly authorizationCodes: AuthorizationCode[] = [];

  public constructor() {
    console.warn('Using default Authorization Code Service. This is only recommended for development.');
  }

  public async create(consent: Consent): Promise<AuthorizationCode> {
    const now = Date.now();

    const authorizationCode: AuthorizationCode = {
      code: randomUUID(),
      isRevoked: false,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 300000),
      validAfter: new Date(now),
      consent,
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
