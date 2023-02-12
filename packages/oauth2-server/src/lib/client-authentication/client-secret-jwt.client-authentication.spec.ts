import { DependencyInjectionContainer } from '@guarani/di';
import { JsonWebKeyParameters, JsonWebKeyType, JsonWebSignatureAlgorithm } from '@guarani/jose';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientSecretJwtClientAuthentication } from './client-secret-jwt.client-authentication';

describe('Client Secret JWT Client Authentication Method', () => {
  let clientAuthentication: ClientSecretJwtClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  const settings = <Settings>{};

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(ClientSecretJwtClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(ClientSecretJwtClientAuthentication);
  });

  describe('algorithms', () => {
    it('should have \'["HS256", "HS384", "HS512"]\' as its value.', () => {
      expect(clientAuthentication['algorithms']).toEqual<JsonWebSignatureAlgorithm[]>([
        JsonWebSignatureAlgorithm.HS256,
        JsonWebSignatureAlgorithm.HS384,
        JsonWebSignatureAlgorithm.HS512,
      ]);
    });
  });

  describe('name', () => {
    it('should have "client_secret_jwt" as its name.', () => {
      expect(clientAuthentication.name).toBe('client_secret_jwt');
    });
  });

  describe('getClientKey()', () => {
    it('should throw when the client does not have a secret.', async () => {
      const client = <Client>{ id: 'client_id' };

      await expect(clientAuthentication['getClientKey'](client)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
        })
      );
    });

    it('should throw when the client secret is expired.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'dZD9jxWOFEiSi-9AjOwmvJKaEJRUBbXl',
        secretExpiresAt: new Date(Date.now() - 3600000),
      };

      await expect(clientAuthentication['getClientKey'](client)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "client_secret_jwt".',
        })
      );
    });

    it('should return a json web key based on the secret of the client.', async () => {
      const client = <Client>{ id: 'client_id', secret: 'dZD9jxWOFEiSi-9AjOwmvJKaEJRUBbXl' };

      await expect(clientAuthentication['getClientKey'](client)).resolves.toMatchObject<JsonWebKeyParameters>({
        kty: JsonWebKeyType.Octet,
        k: 'ZFpEOWp4V09GRWlTaS05QWpPd212SkthRUpSVUJiWGw',
      });
    });
  });
});
