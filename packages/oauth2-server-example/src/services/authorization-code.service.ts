import {
  AuthorizationCodeParameters,
  AuthorizationCodeService as BaseAuthorizationCodeService,
} from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import { randomUUID } from 'crypto';
import { URL } from 'url';

import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';

export class AuthorizationCodeService implements BaseAuthorizationCodeService {
  public async createAuthorizationCode(
    params: AuthorizationCodeParameters,
    scopes: string[],
    client: Client,
    user: User
  ): Promise<AuthorizationCode> {
    const authorizationCode = new AuthorizationCode();

    Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(authorizationCode, {
      code: randomUUID(),
      redirectUri: new URL(params.redirect_uri),
      scopes,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 300000),
      client,
      user,
    });

    await authorizationCode.save();
    return authorizationCode;
  }

  public async findAuthorizationCode(code: string): Promise<Optional<AuthorizationCode>> {
    return (await AuthorizationCode.findOneBy({ code })) ?? undefined;
  }

  public async revokeAuthorizationCode(authorizationCode: AuthorizationCode): Promise<void> {
    authorizationCode.isRevoked = true;
    await authorizationCode.save();
  }
}
