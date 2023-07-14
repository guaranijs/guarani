import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { removeNullishValues } from '@guarani/primitives';

import { InteractionContext } from '../../context/interaction/interaction-context';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { InteractionRequest } from '../../requests/interaction/interaction-request';
import { InteractionRequestValidator } from './interaction-request.validator';

describe('Interaction Request Validator', () => {
  let validator: InteractionRequestValidator;

  const interactionTypesMocks = [
    jest.mocked<InteractionTypeInterface>({ name: 'consent', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'login', handleContext: jest.fn(), handleDecision: jest.fn() }),
  ];

  beforeEach(() => {
    validator = Reflect.construct(InteractionRequestValidator, [interactionTypesMocks]);
  });

  describe('validateContext()', () => {
    let parameters: InteractionRequest;

    const requestFactory = (data: Partial<InteractionRequest> = {}): HttpRequest => {
      removeNullishValues<InteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/interaction?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      parameters = { interaction_type: 'login' };
    });

    it('should return a context interaction context.', async () => {
      const request = requestFactory();

      await expect(validator.validateContext(request)).resolves.toStrictEqual<InteractionContext>({
        parameters,
        interactionType: interactionTypesMocks[1]!,
      });
    });
  });

  describe('validateDecision()', () => {
    let parameters: InteractionRequest;

    const requestFactory = (data: Partial<InteractionRequest> = {}): HttpRequest => {
      removeNullishValues<InteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/interaction'),
      });
    };

    beforeEach(() => {
      parameters = { interaction_type: 'consent' };
    });

    it('should return a decision interaction context.', async () => {
      const request = requestFactory();

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<InteractionContext>({
        parameters,
        interactionType: interactionTypesMocks[0]!,
      });
    });
  });
});
