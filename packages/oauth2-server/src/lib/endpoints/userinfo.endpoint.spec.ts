import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { JsonWebEncryption, JsonWebKeySet, JsonWebSignature, JsonWebTokenClaims, RsaKey } from '@guarani/jose';
import { removeNullishValues } from '@guarani/primitives';

import { AccessToken } from '../entities/access-token.entity';
import { InsufficientScopeException } from '../exceptions/insufficient-scope.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { ClientAuthorizationHandler } from '../handlers/client-authorization.handler';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { UserinfoClaimsParameters } from '../id-token/userinfo.claims.parameters';
import { Logger } from '../logger/logger';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Endpoint } from './endpoint.type';
import { UserinfoEndpoint } from './userinfo.endpoint';

jest.mock('../handlers/client-authorization.handler');
jest.mock('../logger/logger');

describe('Userinfo Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: UserinfoEndpoint;

  const rsaSignKey = new RsaKey({
    kty: 'RSA',
    n:
      'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
      'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
      'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
      'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
      'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
      '5JG5iK0nsm1uZYu-02XN-w',
    e: 'AQAB',
    d:
      'cc2YrWia9LGRad0SMe0PrlmeeHSyRe5-u--QJcP4uF_5LYYzXIsjDJ9_iYh0S_YY' +
      'e6bLjqHOSp44OHvJqoXMX5j3-ECKnNjnUHMtRB2awXGBqBOhB8TqoQXgmXDi1jx_' +
      '6Fu8xH-vaSfpwrsN-0QzIcYHil6b8hwE0f0r6istBmL7iayJbnONp7na9ow2fUQl' +
      'nr41vsHZa4knTZ2E2kq5ntgaXlF6AIdc4DD_BZpf2alEbhQMX9T168ZsSyAs7wKS' +
      'd3ivhHRQayXEapUfZ_ykvnF4-DoVI1iRoowgZ-dlnv4Ff3YrKQ3Zv3uHJcF1BtWQ' +
      'VipOIHx4GyIc4bmTSA5PEQ',
    p:
      '-ZFuDg38cG-e5L6h1Jbn8ngifWgHx8m1gybkY7yEpU1V02fvQAMI1XG-1WpZm2xj' +
      'j218wNCj0BCEdmdBqZMk5RlzLagtfzQ3rPO-ucYPZ_SDmy8Udzr-sZLCqMFyLtxk' +
      'gMfGo4QZ6UJWYpTCCmZ92nS_pa4ePrQdlpnS4DLv_SM',
    q:
      'y1YdZtsbYfCOdsYBZrDpcvubwMN2fKRAzETYW5sqYv8XkxHG1J1zHH-zWJBQfZhT' +
      'biHPgHvoaFykEm9xhuA77RFGRXxFUrGBtfqIx_OG-kRWudmH83EyMzMoKQaW98RX' +
      'WqRO1JDlcs4_vzf_KN63zQKv5i4UdiiObQkZCYIOVUk',
    dp:
      'vqtDX-2DjgtZY_3Y-eiJMRBjmVgfiZ4r1RWjrCddWEVrauafPVKULy6F09s6tqnq' +
      'rqvBgjZk0ROtgCCHZB0NNRNqkdlJWUP1vWdDsf8FyjBfU_J2OlmSOOydV_zjVbX_' +
      '-vumYUsN2M5b3Vk1nmiLgplryhLq_JDzghnnqG6CN-0',
    dq:
      'tKczxBhSwbcpu5i70fLH1iJ5BNAkSyTbdSCNYQYAqKee2Elo76lbhixmuP6upIdb' +
      'SHO9mZd8qov0MXTV1lEOrNc2KbH5HTkb1wRZ1dwlReDFdKUxxjYBtb9zpM93_XVx' +
      'btSgPPbnBBL-S_OCPVtyzS_f-49hGoF52KHGns3v0hE',
    qi:
      'C4q9uIi-1fYhE0NTWVNzdhSi7fA3uznTWaW1X5LWBF4gBOcWvMMTfOZEaPjtY2WP' +
      'XaTWU4bdVN0GgktVLUDPLrSj533W1cOQZb_mm_7BFNrleelruT87bZhWPYQ979kl' +
      '6590ySgbH81pEM8FQW1JBATz0MYtUNZAt8N360vayE4',
    alg: 'RS256',
    kid: 'rsa-sign-key',
    use: 'sig',
  });

  const rsaKeyWrapKey = new RsaKey({
    kty: 'RSA',
    n:
      'sXchDaQebHnPiGvyDOAT4saGEUetSyo9MKLOoWFsueri23bOdgWp4Dy1WlUzewbg' +
      'BHod5pcM9H95GQRV3JDXboIRROSBigeC5yjU1hGzHHyXss8UDprecbAYxknTcQkh' +
      'slANGRUZmdTOQ5qTRsLAt6BTYuyvVRdhS8exSZEy_c4gs_7svlJJQ4H9_NxsiIoL' +
      'wAEk7-Q3UXERGYw_75IDrGA84-lA_-Ct4eTlXHBIY2EaV7t7LjJaynVJCpkv4LKj' +
      'TTAumiGUIuQhrNhZLuF_RJLqHpM2kgWFLU7-VTdL1VbC2tejvcI2BlMkEpk1BzBZ' +
      'I0KQB0GaDWFLN-aEAw3vRw',
    e: 'AQAB',
    d:
      'VFCWOqXr8nvZNyaaJLXdnNPXZKRaWCjkU5Q2egQQpTBMwhprMzWzpR8Sxq1OPThh' +
      '_J6MUD8Z35wky9b8eEO0pwNS8xlh1lOFRRBoNqDIKVOku0aZb-rynq8cxjDTLZQ6' +
      'Fz7jSjR1Klop-YKaUHc9GsEofQqYruPhzSA-QgajZGPbE_0ZaVDJHfyd7UUBUKun' +
      'FMScbflYAAOYJqVIVwaYR5zWEEceUjNnTNo_CVSj-VvXLO5VZfCUAVLgW4dpf1Sr' +
      'tZjSt34YLsRarSb127reG_DUwg9Ch-KyvjT1SkHgUWRVGcyly7uvVGRSDwsXypdr' +
      'NinPA4jlhoNdizK2zF2CWQ',
    p:
      '9gY2w6I6S6L0juEKsbeDAwpd9WMfgqFoeA9vEyEUuk4kLwBKcoe1x4HG68ik918h' +
      'dDSE9vDQSccA3xXHOAFOPJ8R9EeIAbTi1VwBYnbTp87X-xcPWlEPkrdoUKW60tgs' +
      '1aNd_Nnc9LEVVPMS390zbFxt8TN_biaBgelNgbC95sM',
    q:
      'uKlCKvKv_ZJMVcdIs5vVSU_6cPtYI1ljWytExV_skstvRSNi9r66jdd9-yBhVfuG' +
      '4shsp2j7rGnIio901RBeHo6TPKWVVykPu1iYhQXw1jIABfw-MVsN-3bQ76WLdt2S' +
      'DxsHs7q7zPyUyHXmps7ycZ5c72wGkUwNOjYelmkiNS0',
    dp:
      'w0kZbV63cVRvVX6yk3C8cMxo2qCM4Y8nsq1lmMSYhG4EcL6FWbX5h9yuvngs4iLE' +
      'Fk6eALoUS4vIWEwcL4txw9LsWH_zKI-hwoReoP77cOdSL4AVcraHawlkpyd2TWjE' +
      '5evgbhWtOxnZee3cXJBkAi64Ik6jZxbvk-RR3pEhnCs',
    dq:
      'o_8V14SezckO6CNLKs_btPdFiO9_kC1DsuUTd2LAfIIVeMZ7jn1Gus_Ff7B7IVx3' +
      'p5KuBGOVF8L-qifLb6nQnLysgHDh132NDioZkhH7mI7hPG-PYE_odApKdnqECHWw' +
      '0J-F0JWnUd6D2B_1TvF9mXA2Qx-iGYn8OVV1Bsmp6qU',
    qi:
      'eNho5yRBEBxhGBtQRww9QirZsB66TrfFReG_CcteI1aCneT0ELGhYlRlCtUkTRcl' +
      'IfuEPmNsNDPbLoLqqCVznFbvdB7x-Tl-m0l_eFTj2KiqwGqE9PZB9nNTwMVvH3VR' +
      'RSLWACvPnSiwP8N5Usy-WRXS-V7TbpxIhvepTfE0NNo',
    alg: 'RSA-OAEP',
    kid: 'rsa-keywrap-key',
    use: 'enc',
  });

  const jwks = new JsonWebKeySet([rsaSignKey]);

  const loggerMock = jest.mocked(Logger.prototype);

  const clientAuthorizationHandlerMock = jest.mocked(ClientAuthorizationHandler.prototype);

  const settings = <Settings>{ secretKey: '0123456789abcdef' };

  const userServiceMock = jest.mocked<UserServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findByResourceOwnerCredentials: jest.fn(),
    getUserinfo: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(ClientAuthorizationHandler).toValue(clientAuthorizationHandlerMock);
    container.bind(JsonWebKeySet).toValue(jwks);
    container.bind<Settings>(SETTINGS).toValue(settings);
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
      expect(endpoint.httpMethods).toEqual<HttpMethod[]>(['GET', 'POST']);
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

      container.bind<UserServiceInterface>(USER_SERVICE).toValue({ create: jest.fn(), findOne: jest.fn() });
      container.bind(UserinfoEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(UserinfoEndpoint)).toThrow(
        new TypeError('Missing implementation of required method "UserServiceInterface.getUserinfo".'),
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
        url: new URL('https://server.example.com/oauth/userinfo'),
      });
    });

    it('should return an error response when the access token does not have "openid" as one of its scopes.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['foo', 'bar', 'baz', 'qux'],
        client: null,
      };

      const error = new InsufficientScopeException('The provided Access Token is missing the required scope "openid".');
      const errorParameters = removeNullishValues(error.toJSON());

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(error.statusCode);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...error.headers,
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
    });

    it('should return an error response when the access token does not have a client.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
        client: null,
      };

      const error = new InvalidTokenException('Invalid Credentials.');
      const errorParameters = removeNullishValues(error.toJSON());

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(error.statusCode);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...error.headers,
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
    });

    it('should return an error response when the access token does not have a user.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
        client: { id: 'client_id' },
        user: null,
      };

      const error = new InvalidTokenException('Invalid Credentials.');
      const errorParameters = removeNullishValues(error.toJSON());

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(error.statusCode);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...error.headers,
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
    });

    it('should return the claims of the user based on the scopes of the access token.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
        client: { id: 'client_id', subjectType: 'public', userinfoSignedResponseAlgorithm: null },
        user: { id: 'user_id' },
      };

      const claims: UserinfoClaimsParameters = {
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
      userServiceMock.getUserinfo!.mockResolvedValueOnce(claims);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<UserinfoClaimsParameters>({
        sub: 'user_id',
        ...claims,
      });
    });

    it('should return a signed json web token with the claims of the user based on the scopes of the access token.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
        client: {
          id: 'client_id',
          subjectType: 'public',
          userinfoSignedResponseAlgorithm: 'RS256',
          userinfoEncryptedResponseKeyWrap: null,
          userinfoEncryptedResponseContentEncryption: null,
        },
        user: { id: 'user_id' },
      };

      const claims: UserinfoClaimsParameters = {
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
      userServiceMock.getUserinfo!.mockResolvedValueOnce(claims);

      const response = await endpoint.handle(request);

      const signedJwt = response.body.toString('utf8');

      expect(response.statusCode).toEqual(200);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/jwt',
        ...endpoint['headers'],
      });

      expect(JsonWebSignature.isJsonWebSignature(signedJwt)).toBeTrue();

      const { payload } = await JsonWebSignature.verify(
        signedJwt,
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['RS256'],
      );

      const jwtClaims = new JsonWebTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(jwtClaims).toMatchObject(claims);
    });

    it('should return a nested json web token with the claims of the user based on the scopes of the access token.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
        client: {
          id: 'client_id',
          subjectType: 'public',
          jwksUri: null,
          jwks: new JsonWebKeySet([rsaKeyWrapKey]).toJSON(true),
          userinfoSignedResponseAlgorithm: 'RS256',
          userinfoEncryptedResponseKeyWrap: 'RSA-OAEP',
          userinfoEncryptedResponseContentEncryption: 'A128CBC-HS256',
        },
        user: { id: 'user_id' },
      };

      const claims: UserinfoClaimsParameters = {
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
      userServiceMock.getUserinfo!.mockResolvedValueOnce(claims);

      const response = await endpoint.handle(request);

      const encryptedJwt = response.body.toString('utf8');

      expect(response.statusCode).toEqual(200);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/jwt',
        ...endpoint['headers'],
      });

      expect(JsonWebEncryption.isJsonWebEncryption(encryptedJwt)).toBeTrue();

      const { plaintext } = await JsonWebEncryption.decrypt(
        encryptedJwt,
        rsaKeyWrapKey,
        ['RSA-OAEP'],
        ['A128CBC-HS256'],
      );

      const signedJwt = plaintext.toString('ascii');

      expect(JsonWebSignature.isJsonWebSignature(signedJwt)).toBeTrue();

      const { payload } = await JsonWebSignature.verify(
        signedJwt,
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['RS256'],
      );

      const jwtClaims = new JsonWebTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(jwtClaims).toMatchObject(claims);
    });
  });
});
