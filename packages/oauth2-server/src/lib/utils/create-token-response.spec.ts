import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TokenResponse } from '../responses/token-response';
import { createTokenResponse } from './create-token-response';

describe('createTokenResponse()', () => {
  it('should return a token response based on the data of the provided access token.', () => {
    expect(
      createTokenResponse(
        <AccessToken>{ handle: 'access_token', scopes: ['foo', 'bar'], expiresAt: new Date(Date.now() + 3600000) },
        null
      )
    ).toStrictEqual<TokenResponse>({
      access_token: 'access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'foo bar',
      refresh_token: undefined,
    });
  });

  it('should return a token response based on the data of the provided access token and refresh token.', () => {
    expect(
      createTokenResponse(
        <AccessToken>{ handle: 'access_token', scopes: ['foo', 'bar'], expiresAt: new Date(Date.now() + 3600000) },
        <RefreshToken>{ handle: 'refresh_token' }
      )
    ).toStrictEqual<TokenResponse>({
      access_token: 'access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'foo bar',
      refresh_token: 'refresh_token',
    });
  });
});
