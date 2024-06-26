import { DependencyInjectionContainer } from '@guarani/di';
import { JsonWebKeyParameters, JsonWebSignatureAlgorithm } from '@guarani/jose';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { Logger } from '../logger/logger';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientAuthentication } from './client-authentication.type';
import { ClientSecretJwtClientAuthentication } from './client-secret-jwt.client-authentication';

jest.mock('../logger/logger');

describe('Client Secret JWT Client Authentication Method', () => {
  let container: DependencyInjectionContainer;
  let clientAuthentication: ClientSecretJwtClientAuthentication;

  const loggerMock = jest.mocked(Logger.prototype);

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  const settings = <Settings>{};

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(ClientSecretJwtClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(ClientSecretJwtClientAuthentication);
  });

  describe('algorithms', () => {
    it('should have \'["HS256", "HS384", "HS512"]\' as its value.', () => {
      expect(clientAuthentication['algorithms']).toEqual<Exclude<JsonWebSignatureAlgorithm, 'none'>[]>([
        'HS256',
        'HS384',
        'HS512',
      ]);
    });
  });

  describe('name', () => {
    it('should have "client_secret_jwt" as its name.', () => {
      expect(clientAuthentication.name).toEqual<ClientAuthentication>('client_secret_jwt');
    });
  });

  describe('getClientKey()', () => {
    it('should throw when the client does not have a secret.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: null,
      });

      await expect(clientAuthentication['getClientKey'](client)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
      );
    });

    it('should throw when the client secret is expired.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: 'dZD9jxWOFEiSi-9AjOwmvJKaEJRUBbXl',
        secretExpiresAt: new Date(Date.now() - 3600000),
      });

      await expect(clientAuthentication['getClientKey'](client)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
      );
    });

    it('should return a json web key based on the secret of the client.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: 'dZD9jxWOFEiSi-9AjOwmvJKaEJRUBbXl',
      });

      await expect(clientAuthentication['getClientKey'](client)).resolves.toMatchObject<JsonWebKeyParameters>({
        kty: 'oct',
        k: 'ZFpEOWp4V09GRWlTaS05QWpPd212SkthRUpSVUJiWGw',
      });
    });
  });
});
