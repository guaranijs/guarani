import { Injectable } from '@guarani/di';
import { AuthorizationCodeServiceInterface, CodeAuthorizationRequest } from '@guarani/oauth2-server';

import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';

@Injectable()
export class AuthorizationCodeService implements AuthorizationCodeServiceInterface {
  public async create(
    parameters: CodeAuthorizationRequest,
    session: Session,
    consent: Consent
  ): Promise<AuthorizationCode> {
    const now = Date.now();

    const authorizationCode = AuthorizationCode.create({
      parameters,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 300000),
      validAfter: new Date(now),
      session,
      consent,
    });

    await authorizationCode.save();
    return authorizationCode;
  }

  public async findOne(code: string): Promise<AuthorizationCode | null> {
    return await AuthorizationCode.findOneBy({ code });
  }

  public async revoke(authorizationCode: AuthorizationCode): Promise<void> {
    await authorizationCode.remove();
  }
}
