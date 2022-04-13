import { secretToken } from '@guarani/utils';

import { AccessTokenEntity } from '../../lib/entities/access-token.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { ClientCredentialsGrantType } from '../../lib/grant-types/client-credentials.grant-type';
import { SupportedGrantType } from '../../lib/grant-types/types/supported-grant-type';
import { Request } from '../../lib/http/request';
import { AccessTokenService } from '../../lib/services/access-token.service';
import { AccessTokenResponse } from '../../lib/types/access-token.response';

const accessTokenServiceMock = <AccessTokenService>{
  createAccessToken: async (
    _grant: SupportedGrantType,
    scopes: string[],
    client: ClientEntity
  ): Promise<AccessTokenEntity> => {
    const expiration = new Date();
    expiration.setUTCSeconds(expiration.getUTCSeconds() + 300);

    return { token: await secretToken(), tokenType: 'Bearer', scopes, isRevoked: false, expiresAt: expiration, client };
  },
};

const grantType = new ClientCredentialsGrantType(accessTokenServiceMock);

const client = <ClientEntity>{
  id: 'client_id',
  secret: 'client_secret',
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'client_secret_basic',
  responseTypes: [],
  grantTypes: ['client_credentials'],
  redirectUris: [new URL('https://example.com/callback')],
};

describe('Client Credentials Grant Type', () => {
  describe('name', () => {
    it('should have "client_credentials" as its name.', () => {
      expect(grantType.name).toBe<SupportedGrantType>('client_credentials');
    });
  });

  describe('createTokenResponse()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'post', query: {} });
    });

    it('should reject requesting scopes not allowed to the Client.', () => {
      Reflect.set(request, 'body', { scope: 'foo qux' });
      expect(grantType.createTokenResponse(request, client)).rejects.toThrow(InvalidScopeException);
    });

    it('should create an Access Token Response with all the scopes of the Client.', () => {
      expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar baz',
      });
    });

    it('should create an Access Token Response with the requested scopes.', () => {
      Reflect.set(request, 'body', { scope: 'foo baz' });

      expect(grantType.createTokenResponse(request, client)).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo baz',
      });
    });
  });
});
