import { AccessTokenEntity } from '../../lib/entities/access-token.entity';
import { ClientEntity } from '../../lib/entities/client.entity';
import { UserEntity } from '../../lib/entities/user.entity';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { Request } from '../../lib/http/request';
import { SupportedResponseMode } from '../../lib/response-modes/types/supported-response-mode';
import { TokenResponseType } from '../../lib/response-types/token.response-type';
import { SupportedResponseType } from '../../lib/response-types/types/supported-response-type';
import { AccessTokenService } from '../../lib/services/access-token.service';
import { AccessTokenResponse } from '../../lib/types/access-token.response';

const accessTokenServiceMock: jest.Mocked<AccessTokenService> = {
  createAccessToken: jest.fn(async (_grant, scopes, client, user, refreshToken): Promise<AccessTokenEntity> => {
    return {
      token: 'access_token',
      tokenType: 'Bearer',
      scopes,
      audience: client.id,
      isRevoked: false,
      issuedAt: new Date(),
      validAfter: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      client,
      user,
      refreshToken,
    };
  }),
};

const responseType = new TokenResponseType(accessTokenServiceMock);

const client: ClientEntity = {
  id: 'client_id',
  secret: null,
  scopes: ['foo', 'bar', 'baz'],
  authenticationMethod: 'none',
  responseTypes: ['token'],
  grantTypes: ['implicit'],
  redirectUris: ['https://example.com/callback'],
};

const user: UserEntity = { id: 'user_id' };

describe('Token Response Type', () => {
  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(responseType.name).toBe<SupportedResponseType>('token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default Response Mode.', () => {
      expect(responseType.defaultResponseMode).toBe<SupportedResponseMode>('fragment');
    });
  });

  describe('checkParameters()', () => {
    it('should reject using "query" as the "response_mode".', () => {
      // @ts-expect-error Testing a private method.
      expect(() => responseType.checkParameters({ response_mode: 'query' })).toThrow(InvalidRequestException);
    });
  });

  describe('createAuthorizationResponse()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'get', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'query', {});
    });

    it('should reject using "query" as the "response_mode".', async () => {
      request.query.response_mode = 'query';
      await expect(responseType.createAuthorizationResponse(request, client, user)).rejects.toThrow(
        InvalidRequestException
      );
    });

    it('should create an Access Token Response.', async () => {
      request.query.scope = 'foo bar';

      await expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
      });
    });

    it('should create an Access Token Response and pass the State unmodified.', async () => {
      Object.assign(request.query, { scope: 'foo bar', state: 'client-state' });

      await expect(
        responseType.createAuthorizationResponse(request, client, user)
      ).resolves.toMatchObject<AccessTokenResponse>({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: expect.any(Number),
        scope: 'foo bar',
        state: 'client-state',
      });
    });
  });
});
