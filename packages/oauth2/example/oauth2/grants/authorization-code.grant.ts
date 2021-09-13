import { Injectable } from '@guarani/ioc'
import { OneOrMany } from '@guarani/utils'

import {
  AuthorizationCodeGrant as BaseAuthorizationCodeGrant,
  CodeAuthorizationParameters
} from '../../../lib/grants'
import { Client, User, AuthorizationCode } from '../../entities'

@Injectable()
export class AuthorizationCodeGrant extends BaseAuthorizationCodeGrant {
  protected async createAuthorizationCode(
    data: CodeAuthorizationParameters,
    scopes: string[],
    audience: OneOrMany<string>,
    client: Client,
    user: User
  ): Promise<AuthorizationCode> {
    const code = new AuthorizationCode({
      audience,
      client,
      codeChallenge: data.code_challenge,
      codeChallengeMethod: data.code_challenge_method,
      redirectUri: data.redirect_uri,
      scopes,
      user
    })

    await code.save()

    return code
  }

  protected async findAuthorizationCode(
    code: string
  ): Promise<AuthorizationCode> {
    return await AuthorizationCode.findOne({ where: { code } })
  }

  protected async revokeAuthorizationCode(
    authorizationCode: AuthorizationCode
  ): Promise<void> {
    await authorizationCode.remove()
  }
}
