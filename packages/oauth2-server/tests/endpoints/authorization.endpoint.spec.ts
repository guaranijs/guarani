import { Constructor, Dict, Optional } from '@guarani/types';

import { URL } from 'url';

import { AuthorizationEndpoint } from '../../lib/endpoints/authorization.endpoint';
import { ConsentParameters } from '../../lib/endpoints/types/consent.parameters';
import { SupportedEndpoint } from '../../lib/endpoints/types/supported-endpoint';
import { ClientEntity } from '../../lib/entities/client.entity';
import { UserEntity } from '../../lib/entities/user.entity';
import { AccessDeniedException } from '../../lib/exceptions/access-denied.exception';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../lib/exceptions/oauth2.exception';
import { SupportedOAuth2ErrorCode } from '../../lib/exceptions/types/supported-oauth2-error-code';
import { UnauthorizedClientException } from '../../lib/exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../../lib/exceptions/unsupported-response-type.exception';
import { Request } from '../../lib/http/request';
import { Response } from '../../lib/http/response';
import { ResponseMode } from '../../lib/response-modes/response-mode';
import { ResponseType } from '../../lib/response-types/response-type';
import { AuthorizationCodeResponse } from '../../lib/response-types/types/authorization-code.response';
import { ClientService } from '../../lib/services/client.service';

const clients: ClientEntity[] = [
  {
    id: 'client1',
    secret: 'secret1',
    redirectUris: [new URL('https://example.com/callback')],
    authenticationMethod: 'client_secret_basic',
    grantTypes: ['authorization_code'],
    responseTypes: ['code'],
    scopes: ['foo', 'bar', 'baz'],
  },
];

const clientService = <ClientService>{
  findClient: async (clientId: string): Promise<Optional<ClientEntity>> => {
    return clients.find((client) => client.id === clientId);
  },
};

const responseTypes = [
  { name: 'code', defaultResponseMode: 'query', createAuthorizationResponse: jest.fn() },
  { name: 'token', defaultResponseMode: 'fragment', createAuthorizationResponse: jest.fn() },
];

const responseModes = [
  { name: 'query', createHttpResponse: jest.fn() },
  { name: 'fragment', createHttpResponse: jest.fn() },
];

const endpoint = new AuthorizationEndpoint(clientService, <ResponseType[]>responseTypes, <ResponseMode[]>responseModes);

describe('Authorization Endpoint', () => {
  describe('name', () => {
    it('should have "authorization" as its name.', () => {
      expect(endpoint.name).toBe<SupportedEndpoint>('authorization');
    });
  });

  describe('handleFatalAuthorizationError()', () => {
    const spy = jest
      .spyOn<AuthorizationEndpoint, any>(endpoint, 'errorUrl', 'get')
      .mockReturnValue('https://server.example.com/oauth/error');

    it('should return the parameters of the OAuth 2.0 Error in the data of the Response.', () => {
      expect(
        endpoint.handleFatalAuthorizationError(new InvalidRequestException({ error_description: 'description' }))
      ).toMatchObject<Partial<Response>>({
        headers: {
          Location: 'https://server.example.com/oauth/error?error=invalid_request&error_description=description',
        },
        statusCode: 303,
      });
    });

    spy.mockRestore();
  });

  describe('checkParameters()', () => {
    it('should reject not providing a "response_type" parameter.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkParameters({})).toThrow(InvalidRequestException);
    });

    it('should reject not providing a "client_id" parameter.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkParameters({ response_type: 'code' })).toThrow(InvalidRequestException);
    });

    it('should reject not providing a "redirect_uri" parameter.', () => {
      expect(() => {
        // @ts-expect-error Testing a private method.
        endpoint.checkParameters({ response_type: 'code', client_id: 'client_id' });
      }).toThrow(InvalidRequestException);
    });

    it('should reject not providing a "scope" parameter.', () => {
      expect(() => {
        // @ts-expect-error Testing a private method.
        endpoint.checkParameters({
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://example.com/callback',
        });
      }).toThrow(InvalidRequestException);
    });
  });

  describe('getClient()', () => {
    it('should reject when a Client is not found.', () => {
      // @ts-expect-error Testing a private method.
      expect(endpoint.getClient('unknown')).rejects.toThrow(InvalidClientException);
    });

    it('should return a Client based on the Client Identifier.', () => {
      // @ts-expect-error Testing a private method.
      expect(endpoint.getClient('client1')).resolves.toMatchObject(clients[0]);
    });
  });

  describe('getResponseType()', () => {
    it('should reject requesting an unsupported Response Type.', () => {
      // @ts-expect-error Testing a private method; unsupported response type.
      expect(() => endpoint.getResponseType('unknown')).toThrow(UnsupportedResponseTypeException);
    });

    it('should return the requested Response Type.', () => {
      // @ts-expect-error Testing a private method.
      expect(endpoint.getResponseType('code')).toMatchObject(responseTypes[0]);
    });
  });

  describe('checkClientResponseType()', () => {
    it('should reject when a Client requests a Response Type that it is not allowed to request.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkClientResponseType(clients[0], responseTypes[1])).toThrow(UnauthorizedClientException);
    });

    it('should not reject when a Client requests a Response Type that it is allowed to request.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkClientResponseType(clients[0], responseTypes[0])).not.toThrow();
    });
  });

  describe('checkClientRedirectUri()', () => {
    it('should reject when a Client provides a Redirect URI that it is not allowed to use.', () => {
      expect(() => {
        // @ts-expect-error Testing a private method.
        endpoint.checkClientRedirectUri(clients[0], 'https://bad.example.com/callback');
      }).toThrow(AccessDeniedException);
    });

    it('should not reject when a Client provides a Redirect URI that it is allowed to use.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.checkClientRedirectUri(clients[0], 'https://example.com/callback')).not.toThrow();
    });
  });

  describe('getResponseMode()', () => {
    it('should reject requesting an unsupported Response Mode.', () => {
      // @ts-expect-error Testing a private method; unsupported response mode.
      expect(() => endpoint.getResponseMode('unknown')).toThrow(InvalidRequestException);
    });

    it('should return the requested Response Mode.', () => {
      // @ts-expect-error Testing a private method.
      expect(endpoint.getResponseMode('query')).toMatchObject(responseModes[0]);
    });
  });

  describe('getUser()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'get', query: {} });
    });

    it('should reject when the User has not given Consent.', () => {
      // @ts-expect-error Testing a private method.
      expect(() => endpoint.getUser(request)).toThrow(AccessDeniedException);
    });

    it('should return the User of the Request.', () => {
      request.user = { id: 'user_id' };

      // @ts-expect-error Testing a private method.
      expect(endpoint.getUser(request)).toMatchObject<UserEntity>({ id: 'user_id' });
    });
  });

  describe('getConsentParams()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({
        body: {},
        headers: {},
        method: 'get',
        query: {
          response_type: 'code',
          client_id: 'client1',
          redirect_uri: 'https://example.com/callback',
          scope: 'foo bar baz',
          state: 'client-state',
        },
      });
    });

    const requiredParameters: string[] = ['response_type', 'client_id', 'redirect_uri', 'scope'];

    it.each(requiredParameters)(
      'should return an error response when the Client does not provide a required parameter.',
      (requiredParameter) => {
        Reflect.deleteProperty(request.query, requiredParameter);

        expect(endpoint.getConsentParams(request)).rejects.toThrow(InvalidRequestException);
      }
    );

    const invalidChecks: [string, string, Constructor<OAuth2Exception>][] = [
      ['client_id', 'unknown', InvalidClientException],
      ['response_type', 'unknown', UnsupportedResponseTypeException],
      ['response_type', 'token', UnauthorizedClientException],
      ['redirect_uri', 'https://bad.example.com/callback', AccessDeniedException],
    ];

    it.each(invalidChecks)(
      'should return an error response when the data provided fails to validate.',
      (parameter, value, errorConstructor) => {
        request.query[parameter] = value;

        expect(endpoint.getConsentParams(request)).rejects.toThrow(errorConstructor);
      }
    );

    it('should return the Client and the Scopes it requested.', () => {
      expect(endpoint.getConsentParams(request)).resolves.toMatchObject<ConsentParameters>({
        client: clients[0],
        scopes: ['foo', 'bar', 'baz'],
      });
    });
  });

  describe('handle()', () => {
    let request: Request;
    let spyErrorUri: jest.SpyInstance<any, []>;

    beforeEach(() => {
      spyErrorUri = jest
        .spyOn<AuthorizationEndpoint, any>(endpoint, 'errorUrl', 'get')
        .mockReturnValue('https://server.example.com/error');

      request = new Request({
        body: {},
        headers: {},
        method: 'get',
        query: {
          response_type: 'code',
          client_id: 'client1',
          redirect_uri: 'https://example.com/callback',
          scope: 'foo bar baz',
          state: 'client-state',
        },
      });
    });

    afterEach(() => {
      spyErrorUri.mockRestore();
    });

    const requiredParameters: string[] = ['response_type', 'client_id', 'redirect_uri', 'scope'];

    it.each(requiredParameters)(
      'should return an error response when the Client does not provide a required parameter.',
      (requiredParameter) => {
        Reflect.deleteProperty(request.query, requiredParameter);

        expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
          headers: {
            Location: `https://server.example.com/error?error=invalid_request&error_description=Invalid+parameter+%22${requiredParameter}%22.`,
          },
          statusCode: 303,
        });
      }
    );

    const invalidChecks: [string, string, SupportedOAuth2ErrorCode, string][] = [
      ['client_id', 'unknown', 'invalid_client', 'Invalid+Client.'],
      ['response_type', 'unknown', 'unsupported_response_type', 'Unsupported+response_type+%22unknown%22.'],
      [
        'response_type',
        'token',
        'unauthorized_client',
        'This+Client+is+not+allowed+to+request+the+response_type+%22token%22.',
      ],
      ['redirect_uri', 'https://bad.example.com/callback', 'access_denied', 'Invalid+Redirect+URI.'],
      ['response_mode', 'unknown', 'invalid_request', 'Unsupported+response_mode+%22unknown%22.'],
    ];

    it.each(invalidChecks)(
      'should return an error response when the data provided fails to validate.',
      (parameter, value, code, description) => {
        request.query[parameter] = value;

        expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
          headers: { Location: `https://server.example.com/error?error=${code}&error_description=${description}` },
          statusCode: 303,
        });
      }
    );

    it('should return an error response when the End User denied the Authorization Request.', async () => {
      responseModes[0].createHttpResponse.mockReturnValue(
        new Response().redirect(
          'https://example.com/callback?error=access_denied&error_description=Authorization+denied+by+the+End+User.'
        )
      );

      const response = await endpoint.handle(request);

      expect(response).toMatchObject<Partial<Response>>({
        headers: {
          Location:
            'https://example.com/callback?error=access_denied&error_description=Authorization+denied+by+the+End+User.',
        },
        statusCode: 303,
      });

      responseModes[0].createHttpResponse.mockReset();
    });

    it('should return a valid authorization response.', async () => {
      request.user = { id: 'user_id' };

      responseTypes[0].createAuthorizationResponse.mockImplementation((request: Request) => {
        return <AuthorizationCodeResponse>{
          code: 'code',
          state: request.query.state,
        };
      });

      responseModes[0].createHttpResponse.mockImplementation((redirectUri: string, params: Dict) => {
        const url = new URL(redirectUri);
        const searchParams = new URLSearchParams(params);
        url.search = searchParams.toString();
        return new Response().redirect(url.href);
      });

      const response = await endpoint.handle(request);

      expect(response).toMatchObject<Partial<Response>>({
        headers: { Location: 'https://example.com/callback?code=code&state=client-state' },
        statusCode: 303,
      });

      responseModes[0].createHttpResponse.mockReset();
      responseTypes[0].createAuthorizationResponse.mockReset();
    });
  });
});
