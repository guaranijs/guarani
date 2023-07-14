import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { RevocationContext } from '../context/revocation-context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpRequest } from '../http/http.request';
import { RevocationRequest } from '../requests/revocation-request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { TokenTypeHint } from '../types/token-type-hint.type';
import { RevocationRequestValidator } from './revocation-request.validator';

jest.mock('../handlers/client-authentication.handler');

describe('Revocation Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: RevocationRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);

  const settings = <Settings>{ grantTypes: ['refresh_token'], enableRefreshTokenRevocation: true };

  const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(RevocationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(RevocationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('supportedTokenTypeHints', () => {
    it('should have only the type "access_token" when not supporting refresh token revocation.', () => {
      const settings = <Settings>{ enableRefreshTokenRevocation: false };

      container.delete<Settings>(SETTINGS);
      container.delete(RevocationRequestValidator);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(RevocationRequestValidator).toSelf().asSingleton();

      expect(() => (validator = container.resolve(RevocationRequestValidator))).not.toThrow();

      expect(validator['supportedTokenTypeHints']).toEqual<TokenTypeHint[]>(['access_token']);
    });

    it('should have the types ["refresh_token", "access_token"] when supporting access token revocation.', () => {
      expect(validator['supportedTokenTypeHints']).toEqual<TokenTypeHint[]>(['access_token', 'refresh_token']);
    });
  });

  describe('constructor', () => {
    it('should throw when allowing refresh token revocation and the authorization server disables the usage of refresh tokens.', () => {
      const settings = <Settings>{ grantTypes: ['authorization_code'], enableRefreshTokenRevocation: true };

      container.delete<Settings>(SETTINGS);
      container.delete(RevocationRequestValidator);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(RevocationRequestValidator).toSelf().asSingleton();

      expect(() => container.resolve(RevocationRequestValidator)).toThrow(
        new Error('The Authorization Server disabled using Refresh Tokens.')
      );
    });

    it('should throw when allowing refresh token revocation without a refresh token service.', () => {
      container.delete<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);
      container.delete(RevocationRequestValidator);

      container.bind(RevocationRequestValidator).toSelf().asSingleton();

      expect(() => container.resolve(RevocationRequestValidator)).toThrow(
        new Error('Cannot enable Refresh Token Revocation without a Refresh Token Service.')
      );
    });
  });

  describe('validate()', () => {
    let parameters: RevocationRequest;

    const requestFactory = (data: Partial<RevocationRequest> = {}): HttpRequest => {
      removeNullishValues<RevocationRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/revoke'),
      });
    };

    beforeEach(() => {
      parameters = { token: 'access_token' };
    });

    it('should throw when not providing the parameter "token".', async () => {
      const request = requestFactory({ token: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "token".'
      );
    });

    it('should throw when providing an unsupported "token_type_hint".', async () => {
      const request = requestFactory({ token_type_hint: 'unknown' as TokenTypeHint });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        UnsupportedTokenTypeException,
        'Unsupported token_type_hint "unknown".'
      );
    });

    it('should throw when the client fails to authenticate.', async () => {
      const request = requestFactory();

      const error = new InvalidClientException('Lorem ipsum dolor sit amet...');
      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);
      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should search for an access token and then a refresh token when providing an "access_token" token_type_hint.', async () => {
      const request = requestFactory({ token_type_hint: 'access_token' });

      const client = <Client>{ id: 'client_id' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).resolves.toStrictEqual<RevocationContext>({
        parameters,
        client,
        token: null,
        tokenType: null,
      });

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0]!;
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0]!;

      expect(findAccessTokenOrder).toBeLessThan(findRefreshTokenOrder);
    });

    it('should search for a refresh token and then an access token when providing a "refresh_token" token_type_hint.', async () => {
      const request = requestFactory({ token_type_hint: 'refresh_token' });

      const client = <Client>{ id: 'client_id' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).resolves.toStrictEqual<RevocationContext>({
        parameters,
        client,
        token: null,
        tokenType: null,
      });

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0]!;
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0]!;

      expect(findAccessTokenOrder).toBeGreaterThan(findRefreshTokenOrder);
    });

    it('should search for an access token and then a refresh token when not providing a token_type_hint.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).resolves.toStrictEqual<RevocationContext>({
        parameters,
        client,
        token: null,
        tokenType: null,
      });

      expect(accessTokenServiceMock.findOne).toHaveBeenCalledTimes(1);
      expect(refreshTokenServiceMock.findOne).toHaveBeenCalledTimes(1);

      const findAccessTokenOrder = accessTokenServiceMock.findOne.mock.invocationCallOrder[0]!;
      const findRefreshTokenOrder = refreshTokenServiceMock.findOne.mock.invocationCallOrder[0]!;

      expect(findAccessTokenOrder).toBeLessThan(findRefreshTokenOrder);
    });

    it('should return a null revocation context token when the access token does not have a client.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id' };
      const accessToken = <AccessToken>{ handle: 'access_token', client: null };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).resolves.toStrictEqual<RevocationContext>({
        parameters,
        client,
        token: null,
        tokenType: null,
      });
    });

    it('should return a null revocation context token when trying to revoke a refresh token and the authorization server does not support it.', async () => {
      const request = requestFactory({ token: 'refresh_token' });

      const settings = <Settings>{ grantTypes: ['authorization_code'], enableRefreshTokenRevocation: false };

      container.delete<Settings>(SETTINGS);
      container.delete(RevocationRequestValidator);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(RevocationRequestValidator).toSelf().asSingleton();

      validator = container.resolve(RevocationRequestValidator);

      const client = <Client>{ id: 'client_id' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).resolves.toStrictEqual<RevocationContext>({
        parameters,
        client,
        token: null,
        tokenType: null,
      });

      expect(refreshTokenServiceMock.findOne).not.toHaveBeenCalled();
    });

    it('should return an access token revocation context.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id' };
      const accessToken = <AccessToken>{ handle: 'access_token', client };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).resolves.toStrictEqual<RevocationContext>({
        parameters,
        client,
        token: accessToken,
        tokenType: 'access_token',
      });
    });

    it('should return a refresh token revocation context.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id' };
      const refreshToken = <RefreshToken>{ handle: 'refresh_token', client };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);
      refreshTokenServiceMock.findOne.mockResolvedValueOnce(refreshToken);

      await expect(validator.validate(request)).resolves.toStrictEqual<RevocationContext>({
        parameters,
        client,
        token: refreshToken,
        tokenType: 'refresh_token',
      });
    });
  });
});
