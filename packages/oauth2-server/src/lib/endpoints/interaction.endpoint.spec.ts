import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { InteractionContext } from '../context/interaction/interaction.context';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedInteractionTypeException } from '../exceptions/unsupported-interaction-type.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { InteractionTypeInterface } from '../interaction-types/interaction-type.interface';
import { InteractionRequest } from '../requests/interaction/interaction-request';
import { InteractionRequestValidator } from '../validators/interaction/interaction-request.validator';
import { Endpoint } from './endpoint.type';
import { InteractionEndpoint } from './interaction.endpoint';

jest.mock('../validators/interaction/interaction-request.validator');

describe('Interaction Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: InteractionEndpoint;

  const validatorsMocks = [jest.mocked(InteractionRequestValidator.prototype, true)];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    validatorsMocks.forEach((validatorMock) => {
      container.bind(InteractionRequestValidator).toValue(validatorMock);
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
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
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

      const interactionResponse = new HttpResponse()
        .setHeaders(endpoint['headers'])
        .json({ skip: true, client: { id: 'client_id' } });

      const context = <InteractionContext<InteractionRequest>>{
        parameters: <InteractionRequest>request.query,
        cookies: request.cookies,
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'login',
          handleContext: jest.fn().mockResolvedValueOnce(interactionResponse),
          handleDecision: jest.fn(),
        }),
      };

      validatorsMocks[0]!.validateContext.mockResolvedValueOnce(context);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(interactionResponse);
    });

    it('should return an interaction decision response.', async () => {
      Reflect.set(request, 'method', 'POST');

      request.body.interaction_type = 'login';

      const interactionResponse = new HttpResponse()
        .setHeaders(endpoint['headers'])
        .json({ redirect_to: 'https://server.example.com/oauth/authorize' });

      const context = <InteractionContext<InteractionRequest>>{
        parameters: <InteractionRequest>request.body,
        cookies: request.cookies,
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'login',
          handleContext: jest.fn(),
          handleDecision: jest.fn().mockResolvedValueOnce(interactionResponse),
        }),
      };

      validatorsMocks[0]!.validateDecision.mockResolvedValueOnce(context);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(interactionResponse);
    });
  });
});
