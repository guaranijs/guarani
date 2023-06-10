import { Buffer } from 'buffer';

import { DependencyInjectionContainer } from '@guarani/di';

import { SelectAccountContextInteractionContext } from '../../context/interaction/select-account-context.interaction-context';
import { SelectAccountDecisionInteractionContext } from '../../context/interaction/select-account-decision.interaction-context';
import { Grant } from '../../entities/grant.entity';
import { Login } from '../../entities/login.entity';
import { Session } from '../../entities/session.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { SelectAccountContextInteractionRequest } from '../../requests/interaction/select-account-context.interaction-request';
import { SelectAccountDecisionInteractionRequest } from '../../requests/interaction/select-account-decision.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { LoginServiceInterface } from '../../services/login.service.interface';
import { LOGIN_SERVICE } from '../../services/login.service.token';
import { SessionServiceInterface } from '../../services/session.service.interface';
import { SESSION_SERVICE } from '../../services/session.service.token';
import { SelectAccountInteractionRequestValidator } from './select-account.interaction-request.validator';

const invalidSessionIds: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidLoginChallenges: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidLoginIds: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Select Account Interaction Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: SelectAccountInteractionRequestValidator;

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const loginServiceMock = jest.mocked<LoginServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  });

  const interactionTypesMocks = [
    jest.mocked<InteractionTypeInterface>({ name: 'consent', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'login', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({
      name: 'select_account',
      handleContext: jest.fn(),
      handleDecision: jest.fn(),
    }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<LoginServiceInterface>(LOGIN_SERVICE).toValue(loginServiceMock);

    interactionTypesMocks.forEach((interactionTypeMock) => {
      container.bind<InteractionTypeInterface>(INTERACTION_TYPE).toValue(interactionTypeMock);
    });

    container.bind(SelectAccountInteractionRequestValidator).toSelf().asSingleton();

    validator = container.resolve(SelectAccountInteractionRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "select_account" as its name.', () => {
      expect(validator.name).toEqual<InteractionType>('select_account');
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
        query: <SelectAccountContextInteractionRequest>{
          interaction_type: 'select_account',
          login_challenge: 'login_challenge',
          session_id: 'session_id',
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

    it.each(invalidSessionIds)('should throw when providing an invalid "session_id" parameter.', async (sessionId) => {
      request.query.session_id = sessionId;

      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "session_id".'
      );
    });

    it('should throw when no session is found.', async () => {
      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Session Identifier.'
      );
    });

    it('should return a select account context interaction context with the login identifiers of the session.', async () => {
      const grant = <Grant>{ id: 'grant_id' };

      const session = <Session>{
        id: 'session_id',
        logins: [{ id: 'login0_id' }, { id: 'login1_id' }, { id: 'login2_id' }],
      };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<SelectAccountContextInteractionContext>({
        parameters: request.query as SelectAccountContextInteractionRequest,
        interactionType: interactionTypesMocks[2]!,
        grant,
        session,
      });
    });
  });

  describe('validateDecision()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <SelectAccountDecisionInteractionRequest>{
          interaction_type: 'select_account',
          login_challenge: 'login_challenge',
          login_id: 'login1_id',
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

    it.each(invalidLoginIds)('should throw when providing an invalid "login_id" parameter.', async (loginId) => {
      request.body.login_id = loginId;

      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "login_id".'
      );
    });

    it('should throw when no login is found.', async () => {
      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      loginServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Login Identifier.'
      );
    });

    it('should return a select account decision interaction context.', async () => {
      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };
      const login = <Login>{ id: 'login1_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      loginServiceMock.findOne.mockResolvedValueOnce(login);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<SelectAccountDecisionInteractionContext>(
        {
          parameters: request.body as SelectAccountDecisionInteractionRequest,
          interactionType: interactionTypesMocks[2]!,
          grant,
          login,
        }
      );
    });
  });
});
