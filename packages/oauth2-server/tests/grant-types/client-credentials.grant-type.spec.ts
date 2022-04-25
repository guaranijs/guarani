import { secretToken } from '@guarani/utils';

import { AccessToken } from '../../lib/entities/access-token';
import { Client } from '../../lib/entities/client';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { ClientCredentialsGrantType } from '../../lib/grant-types/client-credentials.grant-type';
import { SupportedGrantType } from '../../lib/grant-types/types/supported-grant-type';
import { Request } from '../../lib/http/request';
import { AccessTokenService } from '../../lib/services/access-token.service';
import { AccessTokenResponse } from '../../lib/types/access-token.response';

const client: Client = {
  id: 'client_id',
  secret: 'client_secret',
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'client_secret_basic',
  responseTypes: [],
  grantTypes: ['client_credentials'],
  redirectUris: ['https://example.com/callback'],
};

const accessTokenServiceMock: jest.Mocked<AccessTokenService> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createAccessToken: jest.fn(async (_grant, scopes, client, _user, _refreshToken): Promise<AccessToken> => {
    return {
      token: await secretToken(),
      audience: client.id,
      issuedAt: new Date(),
      validAfter: new Date(),
      tokenType: 'Bearer',
      scopes,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 300000),
      client,
      user: null,
      refreshToken: null,
    };
  }),
};

const grantType = new ClientCredentialsGrantType(accessTokenServiceMock);

describe('Client Credentials Grant Type', () => {
  describe('name', () => {
    it('should have "client_credentials" as its name.', () => {
      expect(grantType.name).toBe<SupportedGrantType>('client_credentials');
    });
  });

  describe('createTokenResponse()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'body', {});
    });

    it('should reject requesting scopes not allowed to the Client.', async () => {
      request.body.scope = 'foo qux';
      await expect(grantType.createTokenResponse(request, client)).rejects.toThrow(InvalidScopeException);
    });

    it('should create an Access Token Response with all the scopes of the Client.', async () => {
      await expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar baz',
      });
    });

    it('should create an Access Token Response with the requested scopes.', async () => {
      request.body.scope = 'foo baz';

      await expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo baz',
      });
    });
  });
});
