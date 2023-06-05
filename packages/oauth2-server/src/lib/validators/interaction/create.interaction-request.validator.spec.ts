import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';

import { CreateContextInteractionContext } from '../../context/interaction/create-context.interaction-context';
import { CreateDecisionInteractionContext } from '../../context/interaction/create-decision.interaction-context';
import { Grant } from '../../entities/grant.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { CreateContextInteractionRequest } from '../../requests/interaction/create-context.interaction-request';
import { CreateDecisionInteractionRequest } from '../../requests/interaction/create-decision.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { CreateInteractionRequestValidator } from './create.interaction-request.validator';

const invalidLoginChallenges: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Create Interaction Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: CreateInteractionRequestValidator;

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const interactionTypesMocks = [
    jest.mocked<InteractionTypeInterface>({ name: 'consent', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'create', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'login', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'logout', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({
      name: 'select_account',
      handleContext: jest.fn(),
      handleDecision: jest.fn(),
    }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);

    interactionTypesMocks.forEach((interactionTypeMock) => {
      container.bind<InteractionTypeInterface>(INTERACTION_TYPE).toValue(interactionTypeMock);
    });

    container.bind(CreateInteractionRequestValidator).toSelf().asSingleton();

    validator = container.resolve(CreateInteractionRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "create" as its name.', () => {
      expect(validator.name).toEqual<InteractionType>('create');
    });
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
        query: <CreateContextInteractionRequest>{
          interaction_type: 'create',
          login_challenge: 'login_challenge',
        },
      });
    });

    it.each(invalidLoginChallenges)(
      'should throw when providing an invalid "login_challenge" parameter.',
      async (loginChallenge) => {
        request.query.login_challenge = loginChallenge;

        await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "login_challenge".'
        );
      }
    );

    it('should throw when no grant is found.', async () => {
      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Login Challenge.'
      );
    });

    it('should return a create context interaction context.', async () => {
      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<CreateContextInteractionContext>({
        parameters: request.query as CreateContextInteractionRequest,
        interactionType: interactionTypesMocks[1]!,
        grant,
      });
    });
  });

  describe('validateDecision()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <CreateDecisionInteractionRequest>{
          interaction_type: 'create',
          login_challenge: 'login_challenge',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/interaction',
        query: {},
      });
    });

    it.each(invalidLoginChallenges)(
      'should throw when providing an invalid "login_challenge" parameter.',
      async (loginChallenge) => {
        request.body.login_challenge = loginChallenge;

        await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "login_challenge".'
        );
      }
    );

    it('should throw when no grant is found.', async () => {
      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Login Challenge.'
      );
    });

    it('should return a create decision interaction context.', async () => {
      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<CreateDecisionInteractionContext>({
        parameters: request.body as CreateDecisionInteractionRequest,
        interactionType: interactionTypesMocks[1]!,
        grant,
      });
    });
  });
});
