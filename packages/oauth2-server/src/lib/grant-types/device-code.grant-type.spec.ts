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
import { Logger } from '../logger/logger';
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

jest.mock('../logger/logger');

describe('Device Code Grant Type', () => {
  let container: DependencyInjectionContainer;
  let grantType: DeviceCodeGrantType;

  const loggerMock = jest.mocked(Logger.prototype);

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

    container.bind(Logger).toValue(loggerMock);
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
    let client: Client;
    let deviceCode: DeviceCode;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        grantTypes: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
      });

      deviceCode = Object.assign<DeviceCode, Partial<DeviceCode>>(Reflect.construct(DeviceCode, []), {
        id: 'device_code',
        scopes: ['foo', 'bar', 'baz'],
        isAuthorized: true,
        issuedAt: new Date(now),
        expiresAt: new Date(now + 300000),
        client,
      });

      context = <DeviceCodeTokenContext>{
        parameters: {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: 'device_code',
        },
        grantType: <GrantTypeInterface>{
          name: 'urn:ietf:params:oauth:grant-type:device_code',
          handle: jest.fn(),
        },
        client,
        deviceCode,
      };
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should throw when the client presents a device code that was not issued to itself.', async () => {
      const anotherClient: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'another_client_id',
      });

      Reflect.set(deviceCode, 'client', anotherClient);

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Authorization denied by the Authorization Server.',
      );

      expect(deviceCodeServiceMock.save).toHaveBeenCalledTimes(1);
      expect(deviceCodeServiceMock.save).toHaveBeenCalledWith({ ...context.deviceCode, isAuthorized: false });
    });

    it('should throw when the device code has expired.', async () => {
      Reflect.set(deviceCode, 'expiresAt', new Date(Date.now() - 300000));
      await expect(grantType.handle(context)).rejects.toThrowWithMessage(ExpiredTokenException, 'Expired Device Code.');
    });

    it('should throw when the application decides that the client should slow down.', async () => {
      deviceCode.isAuthorized = null;
      deviceCodeServiceMock.shouldSlowDown.mockResolvedValueOnce(true);
      await expect(grantType.handle(context)).rejects.toThrow(SlowDownException);
    });

    it('should throw when the authorization is still pending.', async () => {
      deviceCode.isAuthorized = null;
      deviceCodeServiceMock.shouldSlowDown.mockResolvedValueOnce(false);
      await expect(grantType.handle(context)).rejects.toThrow(AuthorizationPendingException);
    });

    it('should throw when the end user denies authorization.', async () => {
      deviceCode.isAuthorized = false;

      await expect(grantType.handle(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Authorization denied by the User.',
      );
    });

    it('should create a token response without a refresh token if the client does not support it.', async () => {
      Reflect.set(client, 'grantTypes', ['urn:ietf:params:oauth:grant-type:device_code']);

      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: deviceCode.scopes,
        },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
        refresh_token: undefined,
      });
    });

    it('should create a token response without a refresh token if the authorization server disables it.', async () => {
      container.delete<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);
      container.delete(DeviceCodeGrantType);

      container.bind(DeviceCodeGrantType).toSelf().asSingleton();

      grantType = container.resolve(DeviceCodeGrantType);

      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: deviceCode.scopes,
        },
      );

      accessTokenServiceMock.create.mockResolvedValueOnce(accessToken);

      await expect(grantType.handle(context)).resolves.toStrictEqual<TokenResponse>({
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar baz',
        refresh_token: undefined,
      });
    });

    it('should create a token response with a refresh token.', async () => {
      const accessToken: AccessToken = Object.assign<AccessToken, Partial<AccessToken>>(
        Reflect.construct(AccessToken, []),
        {
          id: 'access_token',
          expiresAt: new Date(Date.now() + 3600000),
          scopes: deviceCode.scopes,
        },
      );

      const refreshToken: RefreshToken = Object.assign<RefreshToken, Partial<RefreshToken>>(
        Reflect.construct(RefreshToken, []),
        { id: 'refresh_token' },
      );

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
