import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedInteractionTypeException } from '../exceptions/unsupported-interaction-type.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { InteractionTypeInterface } from '../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../interaction-types/interaction-type.token';
import { InteractionRequest } from '../requests/interaction/interaction-request';
import { Endpoint } from './endpoint.type';
import { InteractionEndpoint } from './interaction.endpoint';

describe('Interaction Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: InteractionEndpoint;

  const interactionTypesMock = [
    jest.mocked<InteractionTypeInterface>({ name: 'consent', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'login', handleContext: jest.fn(), handleDecision: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    interactionTypesMock.forEach((interactionType) => {
      container.bind<InteractionTypeInterface>(INTERACTION_TYPE).toValue(interactionType);
    });

    container.bind(InteractionEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(InteractionEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "interaction" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('interaction');
    });
  });

  describe('path', () => {
    it('should have "/oauth/interaction" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/interaction');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET", "POST"]\' as its supported http methods.', () => {
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

  describe('handle()', () => {
    let request: HttpRequest<InteractionRequest>;

    beforeEach(() => {
      request = new HttpRequest<InteractionRequest>({
        body: {},
        cookies: {},
        headers: {},
        method: <HttpMethod>'GET',
        path: '/oauth/interaction',
        query: {},
      });
    });

    it('should return an error response when providing an unsupported http method.', async () => {
      Reflect.set(request, 'method', 'PUT');

      const error = new ServerErrorException({ description: 'An unexpected error occurred.' });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
      );
    });

    it.each(['GET', 'POST'])(
      'should return an error response when not providing an "interaction_type" parameter.',
      async (method) => {
        Reflect.set(request, 'method', method);

        const error = new InvalidRequestException({ description: 'Invalid parameter "interaction_type".' });

        await expect(endpoint.handle(request)).resolves.toStrictEqual(
          new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
        );
      }
    );

    it.each([
      ['GET', 'query'],
      ['POST', 'body'],
    ])('should return an error response when requesting an unsupported interaction type.', async (method, data) => {
      Reflect.set(request, 'method', method);
      Reflect.set(request, data, { interaction_type: 'unknown' });

      const error = new UnsupportedInteractionTypeException({ description: 'Unsupported interaction_type "unknown".' });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
      );
    });

    it('should return an interaction context response.', async () => {
      Reflect.set(request, 'method', 'GET');

      request.query.interaction_type = 'login';

      const interactionTypeResponse: Record<string, any> = { skip: true, client: { id: 'client_id' } };

      interactionTypesMock[1]!.handleContext.mockResolvedValueOnce(interactionTypeResponse);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setHeaders(endpoint['headers']).json(interactionTypeResponse)
      );
    });

    it('should return an interaction decision response.', async () => {
      Reflect.set(request, 'method', 'POST');

      request.body.interaction_type = 'login';

      const interactionTypeResponse: Record<string, any> = { skip: true, client: { id: 'client_id' } };

      interactionTypesMock[1]!.handleDecision.mockResolvedValueOnce(interactionTypeResponse);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setHeaders(endpoint['headers']).json(interactionTypeResponse)
      );
    });
  });
});
