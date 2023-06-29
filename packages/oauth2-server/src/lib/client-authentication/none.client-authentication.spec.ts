import { Buffer } from 'buffer';
import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary, OneOrMany } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthentication } from './client-authentication.type';
import { NoneClientAuthentication } from './none.client-authentication';
import { NoneClientAuthenticationParameters } from './none.client-authentication.parameters';

const methodRequests: [Dictionary<OneOrMany<string>>, boolean][] = [
  [{}, false],
  [{ client_id: '' }, true],
  [{ client_id: 'foo' }, true],
  [{ client_secret: '' }, false],
  [{ client_secret: 'bar' }, false],
  [{ client_id: '', client_secret: '' }, false],
  [{ client_id: 'foo', client_secret: '' }, false],
  [{ client_id: '', client_secret: 'bar' }, false],
  [{ client_id: 'foo', client_secret: 'bar' }, false],
];

describe('None Client Authentication Method', () => {
  let container: DependencyInjectionContainer;
  let clientAuthentication: NoneClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(NoneClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(NoneClientAuthentication);
  });

  describe('name', () => {
    it('should have "none" as its name.', () => {
      expect(clientAuthentication.name).toEqual<ClientAuthentication>('none');
    });
  });

  describe('hasBeenRequested()', () => {
    it.each(methodRequests)('should check if the authentication method has beed requested.', (body, expected) => {
      const request = new HttpRequest({
        body: Buffer.from(stringifyQs(body), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });

      expect(clientAuthentication.hasBeenRequested(request)).toEqual(expected);
    });
  });

  describe('authenticate()', () => {
    let parameters: NoneClientAuthenticationParameters;

    const requestFactory = (data: Partial<NoneClientAuthenticationParameters> = {}): HttpRequest => {
      parameters = Object.assign(parameters, data);

      return new HttpRequest({
        body: Buffer.from(stringifyQs(parameters), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = { client_id: 'client_id' };
    });

    it('should throw when a client is not found.', async () => {
      const request = requestFactory();

      clientServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Credentials.'
      );
    });

    it('should throw when requesting with a client with a secret.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', secret: 'client_secret' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "none".'
      );
    });

    it('should throw when requesting with a client not authorized to use this authentication method.', async () => {
      const request = requestFactory();

      const client = <Client>{
        id: 'client_id',
        secret: null,
        authenticationMethod: 'unknown' as ClientAuthentication,
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "none".'
      );
    });

    it('should return an instance of a client.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', secret: null, authenticationMethod: 'none' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).resolves.toBe(client);
    });
  });
});
