import { AuthorizationServer } from '../lib/authorization-server';
import { Endpoint } from '../lib/endpoints/endpoint';
import { Request } from '../lib/http/request';
import { Response } from '../lib/http/response';
import { AccessTokenResponse } from '../lib/types/access-token.response';

const server = <jest.Mocked<AuthorizationServer>>Reflect.construct(AuthorizationServer, []);

describe('Authorization Server', () => {
  beforeAll(() => {
    Reflect.set(server, 'issuer', 'https://example.com');
    Reflect.set(server, 'endpoints', <jest.Mocked<Endpoint[]>>[
      {
        name: 'token',
        handle: jest.fn(async (request: Request): Promise<Response> => {
          const accessTokenResponse: AccessTokenResponse = {
            access_token: 'access_token',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: request.body.scope,
          };

          return new Response()
            .status(200)
            .setHeaders({ 'Cache-Control': 'no-store', Pragma: 'no-cache' })
            .json(accessTokenResponse);
        }),
      },
    ]);
  });

  describe('endpoint()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'post', query: {} });
    });

    it('should reject calling an unregistered endpoint.', async () => {
      await expect(server.endpoint(<any>'unknown', request)).rejects.toThrow(TypeError);
    });

    it('should return an http response.', async () => {
      Object.assign(request.body, { scope: 'foo bar' });

      await expect(server.endpoint('token', request)).resolves.toMatchObject<Partial<Response>>({
        statusCode: 200,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        body: Buffer.from(
          JSON.stringify({ access_token: 'access_token', token_type: 'Bearer', expires_in: 3600, scope: 'foo bar' }),
          'utf8'
        ),
      });
    });
  });
});
