import { DependencyInjectionContainer } from '@guarani/di';
import { OutgoingHttpHeaders } from 'http';
import { AccessToken } from '../entities/access-token.entity';
import { InsufficientScopeException } from '../exceptions/insufficient-scope.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ClientAuthorizationHandler } from '../handlers/client-authorization.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { UserinfoClaimsParameters } from '../id-token/userinfo.claims.parameters';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Endpoint } from './endpoint.type';
import { UserinfoEndpoint } from './userinfo.endpoint';

jest.mock('../handlers/client-authorization.handler');

describe('Userinfo Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: UserinfoEndpoint;

  const clientAuthorizationHandlerMock = jest.mocked(ClientAuthorizationHandler.prototype, true);

  const userServiceMock = jest.mocked<UserServiceInterface>({
    findOne: jest.fn(),
    findByResourceOwnerCredentials: jest.fn(),
    getUserinfo: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ClientAuthorizationHandler).toValue(clientAuthorizationHandlerMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
    container.bind(UserinfoEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(UserinfoEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "userinfo" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('userinfo');
    });
  });

  describe('path', () => {
    it('should have "/oauth/userinfo" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/userinfo');
    });
  });

  describe('httpMethods', () => {
    it('should have ["GET", "POST"] as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['GET', 'POST']);
    });
  });

  describe('headers', () => {
    it('should have a default "headers" object for the http response.', () => {
      expect(endpoint['headers']).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
    });
  });

  describe('constructor', () => {
    it('should throw when the user service does not implement the method "getUserInfo".', () => {
      container.delete(UserinfoEndpoint);
      container.delete<UserServiceInterface>(USER_SERVICE);

      container.bind<UserServiceInterface>(USER_SERVICE).toValue({ findOne: jest.fn() });
      container.bind(UserinfoEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(UserinfoEndpoint)).toThrow(
        new TypeError('Missing implementation of required method "UserServiceInterface.getUserinfo".')
      );
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: { authorization: 'Bearer access_token' },
        method: 'GET',
        path: '/oauth/userinfo',
        query: {},
      });
    });

    it('should return an error response when the access token does not have "openid" as one of its scopes.', async () => {
      const accessToken = <AccessToken>{ handle: 'access_token', scopes: ['foo', 'bar', 'baz', 'qux'] };

      const error = new InsufficientScopeException({
        description: 'The provided Access Token is missing the required scope "openid".',
      });

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse()
          .setStatus(error.statusCode)
          .setHeaders({ ...error.headers, ...endpoint['headers'] })
          .json(error.toJSON())
      );
    });

    it('should return an error response when the access token does not have a user.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
      };

      const error = new InvalidRequestException({ description: 'Invalid Credentials.' });

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse()
          .setStatus(error.statusCode)
          .setHeaders({ ...error.headers, ...endpoint['headers'] })
          .json(error.toJSON())
      );
    });

    it('should return the claims of the user based on the scopes of the access token.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
        user: { id: 'user_id' },
      };

      const claims: UserinfoClaimsParameters = {
        sub: 'user_id',
        name: 'John H. Doe',
        given_name: 'John',
        middle_name: 'Harold',
        family_name: 'Doe',
        nickname: 'jay',
        preferred_username: 'j.doe',
        profile: 'https://resource-server.example.com/users/user_id',
        picture: 'https://resource-server.example.com/users/user_id/profile.jpg',
        website: 'https://johndoe.blog.example.com',
        email: 'johndoe@email.com',
        email_verified: true,
        gender: 'male',
        birthdate: '1994-07-23',
        zoneinfo: 'America/Los_Angeles',
        locale: 'en-US',
        phone_number: '+15001234567',
        phone_number_verified: true,
        address: {
          formatted: '123 Main Street, Apt 12, Los Angeles LA 12345-6789, US',
          street_address: '123 Main Street, Apt 12',
          locality: 'Los Angeles',
          region: 'LA',
          postal_code: '12345-6789',
          country: 'US',
        },
        updated_at: 1680845015,
      };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setHeaders(endpoint['headers']).json(claims)
      );
    });
  });
});
