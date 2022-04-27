import { IAuthorizationCodeService } from '@guarani/oauth2-server';
import { CodeAuthorizationParameters } from '@guarani/oauth2-server/dist/models/code.authorization-parameters';
import { Optional } from '@guarani/types';

import { AuthorizationCodeEntity } from '../entities/authorization-code.entity';
import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';

export class AuthorizationCodeService implements IAuthorizationCodeService {
  public async createAuthorizationCode(
    parameters: CodeAuthorizationParameters,
    client: ClientEntity,
    user: UserEntity
  ): Promise<AuthorizationCodeEntity> {
    const authorizationCode = AuthorizationCodeEntity.create({
      redirectUri: parameters.redirect_uri,
      codeChallenge: parameters.code_challenge,
      codeChallengeMethod: parameters.code_challenge_method ?? 'plain',
      scopes: parameters.scope.split(' '),
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      validAfter: new Date(),
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
