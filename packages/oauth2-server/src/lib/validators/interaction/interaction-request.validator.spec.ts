import { InteractionContext } from '../../context/interaction/interaction.context';
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
        query: { interaction_type: 'login', login_challenge: 'login_challenge' },
      });
    });

    it('should return a context interaction context.', async () => {
      await expect(validator.validateContext(request)).resolves.toStrictEqual<InteractionContext<InteractionRequest>>({
        parameters: <InteractionRequest>request.query,
        interactionType: interactionTypesMocks[1]!,
      });
    });
  });

  describe('validateDecision()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {
          interaction_type: 'consent',
          consent_challenge: 'consent_challenge',
          decision: 'deny',
          error: 'consent_denied',
          error_description: 'The End User denied the requested consent.',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/interaction',
        query: {},
      });
    });

    it('should return a decision interaction context.', async () => {
      await expect(validator.validateDecision(request)).resolves.toStrictEqual<InteractionContext<InteractionRequest>>({
        parameters: <InteractionRequest>request.body,
        interactionType: interactionTypesMocks[0]!,
      });
    });
  });
});
