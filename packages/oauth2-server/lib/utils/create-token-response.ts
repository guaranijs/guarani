import { removeNullishValues } from '@guarani/objects';
import { Optional } from '@guarani/types';

import { AccessToken } from '../entities/access-token';
import { RefreshToken } from '../entities/refresh-token';
import { TokenResponse } from '../models/token-response';

/**
 * Returns a Token Response to the Client based on the provided Access Token and optional Refresh Token.
 *
 * @param accessToken Access Token issued to the Client.
 * @param refreshToken Optional Refresh Token issued to the Client.
 * @returns Token Response.
 */
export function createTokenResponse(accessToken: AccessToken, refreshToken?: Optional<RefreshToken>): TokenResponse {
  return removeNullishValues<TokenResponse>({
    access_token: accessToken.token,
    token_type: accessToken.tokenType,
    expires_in: Math.ceil((accessToken.expiresAt.getTime() - Date.now()) / 1000),
    scope: accessToken.scopes.join(' '),
    refresh_token: refreshToken?.token,
  });
}
