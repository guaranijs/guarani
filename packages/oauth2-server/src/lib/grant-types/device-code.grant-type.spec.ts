import { DependencyInjectionContainer } from '@guarani/di';

import { DeviceCodeTokenContext } from '../context/token/device-code.token-context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AuthorizationPendingException } from '../exceptions/authorization-pending.exception';
import { ExpiredTokenException } from '../exceptions/expired-token.exception';
import { SlowDownException } from '../exceptions/slow-down.exception';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { DeviceCodeGrantType } from './device-code.grant-type';
import { GrantTypeInterface } from './grant-type.interface';
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
    let context: DeviceCodeTokenContext;

    beforeEach(() => {
      const now = Date.now();

      context = <DeviceCodeTokenContext>{
        parameters: {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: 'device_code',
        },
        grantType: <GrantTypeInterface>{
          name: 'urn:ietf:params:oauth:grant-type:device_code',
          handle: jest.fn(),
        },
        client: <Client>{
          id: 'client_id',
          grantTypes: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
        },
        deviceCode: <DeviceCode>{
          id: 'device_code',
          scopes: ['foo', 'bar', 'baz'],
          isAuthorized: true,
          issuedAt: new Date(now),
          expiresAt: new Date(now + 300000),
          client: {
            id: 'client_id',
            grantTypes: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
          },
        },
      };
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should throw when the client presents a device code that was not issued to itself.', async () => {
      Reflect.set(context.deviceCode.client, 'id', 'another_client_id');

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Authorization denied by the Authorization Server.'
      );

      expect(deviceCodeServiceMock.save).toHaveBeenCalledTimes(1);
      expect(deviceCodeServiceMock.save).toBeCalledWith({ ...context.deviceCode, isAuthorized: false });
    });

    it('should throw when the device code has expired.', async () => {
      Reflect.set(context.deviceCode, 'expiresAt', new Date(Date.now() - 300000));
      await expect(grantType.handle(context)).rejects.toThrowWithMessage(ExpiredTokenException, 'Expired Device Code.');
    });

    it('should throw when the application decides that the client should slow down.', async () => {
      context.deviceCode.isAuthorized = null;
      deviceCodeServiceMock.shouldSlowDown.mockResolvedValueOnce(true);
      await expect(grantType.handle(context)).rejects.toThrowError(SlowDownException);
    });

    it('should throw when the authorization is still pending.', async () => {
      context.deviceCode.isAuthorized = null;
      deviceCodeServiceMock.shouldSlowDown.mockResolvedValueOnce(false);
      await expect(grantType.handle(context)).rejects.toThrowError(AuthorizationPendingException);
    });

    it('should throw when the end user denies authorization.', async () => {
      context.deviceCode.isAuthorized = false;

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Authorization denied by the User.'
      );
    });

    it('should create a token response without a refresh token if the client does not support it.', async () => {
      Reflect.set(context.client, 'grantTypes', ['urn:ietf:params:oauth:grant-type:device_code']);
      Reflect.set(context.deviceCode.client, 'grantTypes', ['urn:ietf:params:oauth:grant-type:device_code']);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: context.deviceCode.scopes,
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
      });
    });

    it('should create a token response without a refresh token if the authorization server disables it.', async () => {
      container.delete<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);
      container.delete(DeviceCodeGrantType);

      container.bind(DeviceCodeGrantType).toSelf().asSingleton();

      grantType = container.resolve(DeviceCodeGrantType);

      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: context.deviceCode.scopes,
      };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
      });
    });

    it('should create a token response with a refresh token.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: context.deviceCode.scopes,
      };

      const refreshToken = <RefreshToken>{ handle: 'refresh_token' };

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);
      refreshTokenServiceMock.create.mockResolvedValueOnce(refreshToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
        refresh_token: 'refresh_token',
      });
    });
  });
});
