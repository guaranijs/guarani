import { OutgoingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { InteractionContext } from '../context/interaction/interaction-context';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedInteractionTypeException } from '../exceptions/unsupported-interaction-type.exception';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { InteractionTypeInterface } from '../interaction-types/interaction-type.interface';
import { InteractionRequest } from '../requests/interaction/interaction-request';
import { InteractionRequestValidator } from '../validators/interaction/interaction-request.validator';
import { Endpoint } from './endpoint.type';
import { InteractionEndpoint } from './interaction.endpoint';

jest.mock('../validators/interaction/interaction-request.validator');

describe('Interaction Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: InteractionEndpoint;

  const validatorMock = jest.mocked(InteractionRequestValidator.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(InteractionRequestValidator).toValue(validatorMock);
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
      expect(endpoint.httpMethods).toEqual<HttpMethod[]>(['GET', 'POST']);
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
      Reflect.deleteProperty(validatorMock, 'name');

      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/interaction',
        query: {},
      });
    });

    it('should return an error response when providing an unsupported http method.', async () => {
      Reflect.set(request, 'method', 'PUT');

      const error = new ServerErrorException('An unexpected error occurred.');
      const errorParameters = removeNullishValues(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(error.statusCode);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        ...error.headers,
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
    });

    it.each(['GET', 'POST'])(
      'should return an error response when not providing an "interaction_type" parameter.',
      async (method) => {
        Reflect.set(request, 'method', method);

        const error = new InvalidRequestException('Invalid parameter "interaction_type".');
        const errorParameters = removeNullishValues(error.toJSON());

        const response = await endpoint.handle(request);

        expect(response.statusCode).toEqual(error.statusCode);

        expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

        expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
          'Content-Type': 'application/json',
          ...error.headers,
        });

        expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
      }
    );

    it.each([
      ['GET', 'query'],
      ['POST', 'body'],
    ])('should return an error response when requesting an unsupported interaction type.', async (method, data) => {
      Reflect.set(request, 'method', method);
      Reflect.set(request, data, { interaction_type: 'unknown' });

      const error = new UnsupportedInteractionTypeException('Unsupported interaction_type "unknown".');
      const errorParameters = removeNullishValues(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(error.statusCode);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        ...error.headers,
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
    });

    it('should return an interaction context response.', async () => {
      Reflect.set(validatorMock, 'name', 'login');
      Reflect.set(request, 'method', 'GET');

      request.query.interaction_type = 'login';

      const interactionResponse: Dictionary<unknown> = { skip: true, client: { id: 'client_id' } };

      const context = <InteractionContext>{
        parameters: request.query as InteractionRequest,
        cookies: request.cookies,
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'login',
          handleContext: jest.fn().mockResolvedValueOnce(interactionResponse),
          handleDecision: jest.fn(),
        }),
      };

      validatorMock.validateContext.mockResolvedValueOnce(context);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(interactionResponse);
    });

    it('should return an interaction decision response.', async () => {
      Reflect.set(validatorMock, 'name', 'login');
      Reflect.set(request, 'method', 'POST');

      request.body.interaction_type = 'login';

      const interactionResponse: Dictionary<unknown> = { redirect_to: 'https://server.example.com/oauth/authorize' };

      const context = <InteractionContext>{
        parameters: request.body as InteractionRequest,
        cookies: request.cookies,
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'login',
          handleContext: jest.fn(),
          handleDecision: jest.fn().mockResolvedValueOnce(interactionResponse),
        }),
      };

      validatorMock.validateDecision.mockResolvedValueOnce(context);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(interactionResponse);
    });
  });
});
