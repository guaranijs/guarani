import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';

import { LoginContextInteractionContext } from '../../context/interaction/login-context.interaction.context';
import { LoginDecisionAcceptInteractionContext } from '../../context/interaction/login-decision-accept.interaction.context';
import { LoginDecisionDenyInteractionContext } from '../../context/interaction/login-decision-deny.interaction.context';
import { Grant } from '../../entities/grant.entity';
import { User } from '../../entities/user.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { LoginDecision } from '../../interaction-types/login-decision.type';
import { LoginContextInteractionRequest } from '../../requests/interaction/login-context.interaction-request';
import { LoginDecisionAcceptInteractionRequest } from '../../requests/interaction/login-decision-accept.interaction-request';
import { LoginDecisionDenyInteractionRequest } from '../../requests/interaction/login-decision-deny.interaction-request';
import { LoginDecisionInteractionRequest } from '../../requests/interaction/login-decision.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { LoginInteractionRequestValidator } from './login.interaction-request.validator';

const invalidLoginChallenges: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidDecisions: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidSubjects: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidAuthenticationMethods: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidAuthenticationContextClasses: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidErrors: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidErrorDescriptions: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Login Interaction Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: LoginInteractionRequestValidator;

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const userServiceMock = jest.mocked<UserServiceInterface>({
    findOne: jest.fn(),
    findByResourceOwnerCredentials: jest.fn(),
    getUserinfo: jest.fn(),
  });

  const interactionTypesMocks = [
    jest.mocked<InteractionTypeInterface>({ name: 'consent', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'login', handleContext: jest.fn(), handleDecision: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);

    interactionTypesMocks.forEach((interactionTypeMock) => {
      container.bind<InteractionTypeInterface>(INTERACTION_TYPE).toValue(interactionTypeMock);
    });

    container.bind(LoginInteractionRequestValidator).toSelf().asSingleton();

    validator = container.resolve(LoginInteractionRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "login" as its name.', () => {
      expect(validator.name).toEqual<InteractionType>('login');
    });
  });

  describe('validateContext()', () => {
    let request: HttpRequest<LoginContextInteractionRequest>;

    beforeEach(() => {
      request = new HttpRequest<LoginContextInteractionRequest>({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/interaction',
        query: { interaction_type: 'login', login_challenge: 'login_challenge' },
      });
    });

    it.each(invalidLoginChallenges)(
      'should throw when providing an invalid "login_challenge" parameter.',
      async (loginChallenge) => {
        request.query.login_challenge = loginChallenge;

        await expect(validator.validateContext(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "login_challenge".' })
        );
      }
    );

    it('should throw when no grant is found.', async () => {
      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Login Challenge.' })
      );
    });

    it('should return a login context interaction context.', async () => {
      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<LoginContextInteractionContext>({
        parameters: request.data,
        interactionType: interactionTypesMocks[1]!,
        grant,
      });
    });
  });

  describe('validateDecision()', () => {
    let request: HttpRequest<LoginDecisionInteractionRequest<LoginDecision>>;

    beforeEach(() => {
      request = new HttpRequest<LoginDecisionInteractionRequest<LoginDecision>>({
        body: { interaction_type: 'login', login_challenge: 'login_challenge', decision: '' },
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

        await expect(validator.validateDecision(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "login_challenge".' })
        );
      }
    );

    it('should throw when no grant is found.', async () => {
      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Login Challenge.' })
      );
    });

    it.each(invalidDecisions)('should throw when providing an invalid "decision" parameter.', async (decision) => {
      request.body.decision = decision;

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "decision".' })
      );
    });

    it('should throw when providing an unsupported decision.', async () => {
      request.body.decision = 'unknown';

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported decision "unknown".' })
      );
    });

    // #region Accept Decision
    it.each(invalidSubjects)('should throw when providing an invalid "subject" parameter.', async (subject) => {
      Object.assign(request.body, { decision: 'accept', subject });

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "subject".' })
      );
    });

    it('should throw when no user is found.', async () => {
      Object.assign(request.body, { decision: 'accept', subject: 'user_id' });

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      userServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid User.' })
      );
    });

    it.each(invalidAuthenticationMethods)('should throw when providing an invalid "amr" parameter.', async (amr) => {
      Object.assign(request.body, { decision: 'accept', subject: 'user_id', amr });

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };
      const user = <User>{ id: 'user_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      userServiceMock.findOne.mockResolvedValueOnce(user);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "amr".' })
      );
    });

    it.each(invalidAuthenticationContextClasses)(
      'should throw when providing an invalid "acr" parameter.',
      async (acr) => {
        Object.assign(request.body, { decision: 'accept', subject: 'user_id', amr: 'pwd sms', acr });

        const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };
        const user = <User>{ id: 'user_id' };

        grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
        userServiceMock.findOne.mockResolvedValueOnce(user);

        await expect(validator.validateDecision(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "acr".' })
        );
      }
    );

    it('should return a login decision accept interaction context.', async () => {
      Object.assign(request.body, { decision: 'accept', subject: 'user_id', amr: 'pwd sms', acr: 'guarani:acr:2fa' });

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };
      const user = <User>{ id: 'user_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      userServiceMock.findOne.mockResolvedValueOnce(user);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LoginDecisionAcceptInteractionContext>({
        parameters: <LoginDecisionAcceptInteractionRequest>request.data,
        interactionType: interactionTypesMocks[1]!,
        grant,
        decision: 'accept',
        user,
        amr: ['pwd', 'sms'],
        acr: 'guarani:acr:2fa',
      });
    });
    // #endregion

    // #region Deny Decision
    it.each(invalidErrors)('should throw when providing an invalid "error" parameter.', async (error) => {
      Object.assign(request.body, { decision: 'deny', error });

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "error".' })
      );
    });

    it.each(invalidErrorDescriptions)(
      'should throw when providing an invalid "error_description" parameter.',
      async (errorDescription) => {
        Object.assign(request.body, { decision: 'deny', error: 'login_denied', error_description: errorDescription });

        const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

        grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

        await expect(validator.validateDecision(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "error_description".' })
        );
      }
    );

    it('should return a login decision deny interaction context.', async () => {
      Object.assign(request.body, {
        decision: 'deny',
        error: 'login_denied',
        error_description: 'Lorem ipsum dolor sit amet...',
      });

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };

      const error: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, [{ description: request.data.error_description }]),
        { code: request.data.error }
      );

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LoginDecisionDenyInteractionContext>({
        parameters: <LoginDecisionDenyInteractionRequest>request.data,
        interactionType: interactionTypesMocks[1]!,
        grant,
        decision: 'deny',
        error,
      });
    });
    // #endregion
  });
});
