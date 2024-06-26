import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TokenResponse } from '../responses/token-response';

/**
 * Returns a formatted Token Response based on the provided Access Token and optional Refresh Token.
 *
 * @param accessToken Access Token issued to the Client.
 * @param refreshToken Refresh Token issued to the Client.
 * @returns Formatted Token Response.
 */
export function createTokenResponse(accessToken: AccessToken, refreshToken: Nullable<RefreshToken>): TokenResponse {
  return {
    access_token: accessToken.id,
    token_type: 'Bearer',
    expires_in: Math.ceil((accessToken.expiresAt.getTime() - Date.now()) / 1000),
    scope: accessToken.scopes.join(' '),
    refresh_token: refreshToken?.id,
  };
}
