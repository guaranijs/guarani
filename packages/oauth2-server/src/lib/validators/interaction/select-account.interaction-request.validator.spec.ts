import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

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
    findByUserId: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
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
    let parameters: SelectAccountContextInteractionRequest;

    const requestFactory = (data: Partial<SelectAccountContextInteractionRequest> = {}): HttpRequest => {
      removeNullishValues<SelectAccountContextInteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/interaction?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      parameters = { interaction_type: 'select_account', login_challenge: 'login_challenge', session_id: 'session_id' };
    });

    it('should throw when not providing the parameter "login_challenge".', async () => {
      const request = requestFactory({ login_challenge: undefined });

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "login_challenge".',
      );
    });

    it('should throw when no grant is found.', async () => {
      const request = requestFactory();

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Login Challenge.',
      );
    });

    it('should throw when not providing the parameter "session_id".', async () => {
      const request = requestFactory({ session_id: undefined });

      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "session_id".',
      );
    });

    it('should throw when no session is found.', async () => {
      const request = requestFactory();

      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Session Identifier.',
      );
    });

    it('should return a select account context interaction context with the login identifiers of the session.', async () => {
      const request = requestFactory();

      const grant = <Grant>{ id: 'grant_id' };

      const session = <Session>{
        id: 'session_id',
        logins: [{ id: 'login0_id' }, { id: 'login1_id' }, { id: 'login2_id' }],
      };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<SelectAccountContextInteractionContext>({
        parameters,
        interactionType: interactionTypesMocks[2]!,
        grant,
        session,
      });
    });
  });

  describe('validateDecision()', () => {
    let parameters: SelectAccountDecisionInteractionRequest;

    const requestFactory = (data: Partial<SelectAccountDecisionInteractionRequest> = {}): HttpRequest => {
      removeNullishValues<SelectAccountDecisionInteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/interaction'),
      });
    };

    beforeEach(() => {
      parameters = { interaction_type: 'select_account', login_challenge: 'login_challenge', login_id: 'login1_id' };
    });

    it('should throw when not providing the parameter "login_challenge".', async () => {
      const request = requestFactory({ login_challenge: undefined });

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "login_challenge".',
      );
    });

    it('should throw when no grant is found.', async () => {
      const request = requestFactory();

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Login Challenge.',
      );
    });

    it('should throw when not providing the parameter "login_id".', async () => {
      const request = requestFactory({ login_id: undefined });

      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "login_id".',
      );
    });

    it('should throw when no login is found.', async () => {
      const request = requestFactory();

      const grant = <Grant>{ id: 'grant_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      loginServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Login Identifier.',
      );
    });

    it('should return a select account decision interaction context.', async () => {
      const request = requestFactory();

      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge' };
      const login = <Login>{ id: 'login1_id' };

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      loginServiceMock.findOne.mockResolvedValueOnce(login);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<SelectAccountDecisionInteractionContext>(
        {
          parameters,
          interactionType: interactionTypesMocks[2]!,
          grant,
          login,
        },
      );
    });
  });
});
