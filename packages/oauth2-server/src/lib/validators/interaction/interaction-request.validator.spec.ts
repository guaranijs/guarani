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
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/interaction',
        query: <InteractionRequest>{ interaction_type: 'login' },
      });
    });

    it('should return a context interaction context.', async () => {
      await expect(validator.validateContext(request)).resolves.toStrictEqual<InteractionContext>({
        parameters: request.query as InteractionRequest,
        interactionType: interactionTypesMocks[1]!,
      });
    });
  });

  describe('validateDecision()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <InteractionRequest>{ interaction_type: 'consent' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/interaction',
        query: {},
      });
    });

    it('should return a decision interaction context.', async () => {
      await expect(validator.validateDecision(request)).resolves.toStrictEqual<InteractionContext>({
        parameters: request.body as InteractionRequest,
        interactionType: interactionTypesMocks[0]!,
      });
    });
  });
});
