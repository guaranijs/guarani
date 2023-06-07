import { Injectable } from '@guarani/di';
import { AuthorizationCodeServiceInterface, CodeAuthorizationRequest } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';

@Injectable()
export class AuthorizationCodeService implements AuthorizationCodeServiceInterface {
  public async create(
    parameters: CodeAuthorizationRequest,
    login: Login,
    consent: Consent
  ): Promise<AuthorizationCode> {
    const now = Date.now();

    const authorizationCode = AuthorizationCode.create({
      parameters,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 300000),
      validAfter: new Date(now),
      login,
      consent,
    });

    await authorizationCode.save();
    return authorizationCode;
  }

  public async findOne(code: string): Promise<Nullable<AuthorizationCode>> {
    return await AuthorizationCode.findOneBy({ code });
  }

  public async revoke(authorizationCode: AuthorizationCode): Promise<void> {
    await authorizationCode.remove();
  }
}
