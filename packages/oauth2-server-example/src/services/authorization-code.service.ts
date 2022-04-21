import {
  AuthorizationCodeParameters,
  AuthorizationCodeService as BaseAuthorizationCodeService,
} from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import { randomUUID } from 'crypto';
import { URL } from 'url';

import { AuthorizationCodeEntity } from '../entities/authorization-code.entity';
import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';

export class AuthorizationCodeService implements BaseAuthorizationCodeService {
  public async createAuthorizationCode(
    params: AuthorizationCodeParameters,
    scopes: string[],
    client: ClientEntity,
    user: UserEntity
  ): Promise<AuthorizationCodeEntity> {
    const authorizationCode = new AuthorizationCodeEntity();

    Object.assign<AuthorizationCodeEntity, Partial<AuthorizationCodeEntity>>(authorizationCode, {
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

  public async findAuthorizationCode(code: string): Promise<Optional<AuthorizationCodeEntity>> {
    return (await AuthorizationCodeEntity.findOneBy({ code })) ?? undefined;
  }

  public async revokeAuthorizationCode(authorizationCode: AuthorizationCodeEntity): Promise<void> {
    authorizationCode.isRevoked = true;
    await authorizationCode.save();
  }
}
