import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AuthorizationPendingException } from '../exceptions/authorization-pending.exception';
import { ExpiredTokenException } from '../exceptions/expired-token.exception';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { SlowDownException } from '../exceptions/slow-down.exception';
import { DeviceCodeTokenRequest } from '../requests/token/device-code.token-request';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { DeviceCodeGrantType } from './device-code.grant-type';
import { GrantType } from './grant-type.type';

describe('Device Code Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: DeviceCodeGrantType;

  const deviceCodeServiceMock = jest.mocked<DeviceCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    shouldSlowDown: jest.fn(),
  });

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const refreshTokenServiceMock = jest.mocked<RefreshTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<DeviceCodeServiceInterface>(DEVICE_CODE_SERVICE).toValue(deviceCodeServiceMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE).toValue(refreshTokenServiceMock);
    container.bind(DeviceCodeGrantType).toSelf().asSingleton();

    grantType = container.resolve(DeviceCodeGrantType);
  });

  describe('name', () => {
    it('should have "urn:ietf:params:oauth:grant-type:device_code" as its name.', () => {
      expect(grantType.name).toEqual<GrantType>('urn:ietf:params:oauth:grant-type:device_code');
    });
  });

  describe('handle()', () => {
    let parameters: DeviceCodeTokenRequest;

    beforeEach(() => {
      parameters = <DeviceCodeTokenRequest>{
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: 'device_code',
      };
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should throw when not providing a "device_code" parameter.', async () => {
      Reflect.deleteProperty(parameters, 'device_code');

      const client = <Client>{};

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "device_code".' })
      );
    });

    it('should throw when no device code is found.', async () => {
      const client = <Client>{};

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new InvalidGrantException({ description: 'Invalid Device Code.' })
      );
    });

    it('should throw when the client presents a device code that was not issued to itself.', async () => {
      const client = <Client>{ id: 'another_client_id' };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{ client: { id: 'client_id' } });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new AccessDeniedException({ description: 'Authorization denied by the Authorization Server.' })
      );

      expect(deviceCodeServiceMock.save).toHaveBeenCalledTimes(1);
      expect(deviceCodeServiceMock.save).toBeCalledWith(<DeviceCode>{
        isAuthorized: false,
        client: { id: 'client_id' },
      });
    });

    it('should throw when the device code has expired.', async () => {
      const client = <Client>{ id: 'client_id' };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{
        expiresAt: new Date(Date.now() - 300000),
        client,
      });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new ExpiredTokenException({ description: 'Expired Device Code.' })
      );
    });

    it('should throw when the application decides that the client should slow down.', async () => {
      const client = <Client>{ id: 'client_id' };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{
        expiresAt: new Date(Date.now() + 300000),
        client,
      });

      deviceCodeServiceMock.shouldSlowDown.mockResolvedValueOnce(true);

      await expect(grantType.handle(parameters, client)).rejects.toThrow(new SlowDownException());
    });

    it('should throw when the authorization is still pending.', async () => {
      const client = <Client>{ id: 'client_id' };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{
        expiresAt: new Date(Date.now() + 300000),
        client,
      });

      deviceCodeServiceMock.shouldSlowDown.mockResolvedValueOnce(false);

      await expect(grantType.handle(parameters, client)).rejects.toThrow(new AuthorizationPendingException());
    });

    it('should throw when the end user denies authorization.', async () => {
      const client = <Client>{ id: 'client_id' };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{
        isAuthorized: false,
        expiresAt: new Date(Date.now() + 300000),
        client,
      });

      await expect(grantType.handle(parameters, client)).rejects.toThrow(
        new AccessDeniedException({ description: 'Authorization denied by the User.' })
      );
    });

    it('should create a token response without a refresh token if the client does not support it.', async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['urn:ietf:params:oauth:grant-type:device_code'] };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{
        isAuthorized: true,
        expiresAt: new Date(Date.now() + 300000),
        client,
      });

      accessTokenServiceMock.create.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: ['foo', 'bar', 'baz'],
      });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
      });
    });

    it('should create a token response without a refresh token if the authorization server disables it.', async () => {
      Reflect.deleteProperty(grantType, 'refreshTokenService');

      const client = <Client>{
        id: 'client_id',
        grantTypes: ['refresh_token', 'urn:ietf:params:oauth:grant-type:device_code'],
      };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{
        isAuthorized: true,
        expiresAt: new Date(Date.now() + 300000),
        client,
      });

      accessTokenServiceMock.create.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: ['foo', 'bar', 'baz'],
      });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
      });

      Reflect.set(grantType, 'refreshTokenService', refreshTokenServiceMock);
    });

    it('should create a token response with a refresh token.', async () => {
      const client = <Client>{
        id: 'client_id',
        grantTypes: ['refresh_token', 'urn:ietf:params:oauth:grant-type:device_code'],
      };

      deviceCodeServiceMock.findOne.mockResolvedValueOnce(<DeviceCode>{
        isAuthorized: true,
        expiresAt: new Date(Date.now() + 300000),
        client,
      });

      accessTokenServiceMock.create.mockResolvedValueOnce(<AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: ['foo', 'bar', 'baz'],
      });

      refreshTokenServiceMock.create.mockResolvedValueOnce(<RefreshToken>{ handle: 'refresh_token' });

      await expect(grantType.handle(parameters, client)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
        refresh_token: 'refresh_token',
      });
    });
  });
});
