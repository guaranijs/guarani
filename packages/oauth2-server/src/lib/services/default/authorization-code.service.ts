import { randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { AuthorizationCode } from '../../entities/authorization-code.entity';
import { Consent } from '../../entities/consent.entity';
import { Login } from '../../entities/login.entity';
import { Logger } from '../../logger/logger';
import { CodeAuthorizationRequest } from '../../requests/authorization/code.authorization-request';
import { AuthorizationCodeServiceInterface } from '../authorization-code.service.interface';

@Injectable()
export class AuthorizationCodeService implements AuthorizationCodeServiceInterface {
  protected readonly authorizationCodes: AuthorizationCode[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Authorization Code Service. This is only recommended for development.`,
      'c27ffbe7-debd-42dd-8581-d0b6c601dbca',
    );
  }

  public async create(
    parameters: CodeAuthorizationRequest,
    login: Login,
    consent: Consent,
  ): Promise<AuthorizationCode> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, '0c45d7f5-987c-4abc-94e1-38233c8b9d7c', {
      parameters,
      login,
      consent,
    });

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
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, 'f32c431e-075e-4138-bb96-7be2e76bd1e0', {
      code,
    });

    return this.authorizationCodes.find((authorizationCode) => authorizationCode.code === code) ?? null;
  }

  public async revoke(authorizationCode: AuthorizationCode): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called revoke()`, 'be13a0fb-9803-4e8a-ba52-827390bc2f40', {
      authorization_code: authorizationCode,
    });

    authorizationCode.isRevoked = true;
  }
}
