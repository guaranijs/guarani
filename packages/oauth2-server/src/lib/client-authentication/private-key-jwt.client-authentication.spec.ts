import { DependencyInjectionContainer } from '@guarani/di';
import {
  EllipticCurveKey,
  JsonWebKeySet,
  JsonWebSignatureHeaderParameters,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientAuthentication } from './client-authentication.type';
import { PrivateKeyJwtClientAuthentication } from './private-key-jwt.client-authentication';

const ecKey = new EllipticCurveKey({
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
  kid: 'ec-key',
});

const jwks = new JsonWebKeySet([ecKey]);

const header: JsonWebSignatureHeaderParameters = { alg: 'ES256', kid: 'ec-key' };

describe('Private Key JWT Client Authentication Method', () => {
  let clientAuthentication: PrivateKeyJwtClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  const settings = <Settings>{};

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(PrivateKeyJwtClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(PrivateKeyJwtClientAuthentication);
  });

  describe('algorithms', () => {
    it('should have \'["ES256", "ES384", "ES512", "EdDSA", "PS256", "PS384", "PS512", "RS256", "RS384", "RS512"]\' as its value.', () => {
      expect(clientAuthentication['algorithms']).toEqual<Exclude<JsonWebSignatureAlgorithm, 'none'>[]>([
        'ES256',
        'ES384',
        'ES512',
        'EdDSA',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ]);
    });
  });

  describe('name', () => {
    it('should have "private_key_jwt" as its name.', () => {
      expect(clientAuthentication.name).toEqual<ClientAuthentication>('private_key_jwt');
    });
  });

  describe('getClientKey()', () => {
    it('should throw when the client does not have a jwks registered.', async () => {
      const client = <Client>{ id: 'client_id' };

      await expect(clientAuthentication['getClientKey'](client, header)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "private_key_jwt".',
        })
      );
    });

    it('should throw when the client does not have the requested json web key registered.', async () => {
      const client = <Client>{
        id: 'client_id',
        authenticationMethod: 'private_key_jwt',
        jwks: jwks.toJSON(),
      };

      await expect(clientAuthentication['getClientKey'](client, { ...header, kid: 'rsa-key' })).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "private_key_jwt".',
        })
      );
    });

    it('should return a json web key from the "jwksUri" of the client.', async () => {
      jest
        .spyOn<PrivateKeyJwtClientAuthentication, any>(clientAuthentication, 'getClientJwksFromUri')
        .mockResolvedValueOnce(JsonWebKeySet.load(jwks));

      const client = <Client>{
        id: 'client_id',
        authenticationMethod: 'private_key_jwt',
        jwksUri: 'https://client.example.com/jwks',
      };

      await expect(clientAuthentication['getClientKey'](client, header)).resolves.toMatchObject(ecKey);
    });

    it('should return a json web key from the "jwks" of the client.', async () => {
      const client = <Client>{
        id: 'client_id',
        authenticationMethod: 'private_key_jwt',
        jwks: jwks.toJSON(),
      };

      await expect(clientAuthentication['getClientKey'](client, header)).resolves.toMatchObject(ecKey);
    });
  });
});
