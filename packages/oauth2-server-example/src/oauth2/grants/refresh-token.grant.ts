import { Injectable } from '@guarani/ioc'
import { RefreshTokenGrant as BaseRefreshTokenGrant } from '@guarani/oauth2'

import { RefreshToken } from '../../entities'

@Injectable()
export class RefreshTokenGrant extends BaseRefreshTokenGrant {
  protected async findRefreshToken(token: string): Promise<RefreshToken> {
    return await RefreshToken.findOne({
      where: { token },
      withDeleted: true
    })
  }

  protected async revokeRefreshToken(
    refreshToken: RefreshToken
  ): Promise<void> {
    await refreshToken.softRemove()
  }
}
