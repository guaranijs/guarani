import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { LoginContextInteractionContext } from '../../context/interaction/login-context.interaction-context';
import { LoginDecisionAcceptInteractionContext } from '../../context/interaction/login-decision-accept.interaction-context';
import { LoginDecisionDenyInteractionContext } from '../../context/interaction/login-decision-deny.interaction-context';
import { Client } from '../../entities/client.entity';
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
import { Logger } from '../../logger/logger';
import { LoginContextInteractionRequest } from '../../requests/interaction/login-context.interaction-request';
import { LoginDecisionInteractionRequest } from '../../requests/interaction/login-decision.interaction-request';
import { LoginDecisionAcceptInteractionRequest } from '../../requests/interaction/login-decision-accept.interaction-request';
import { LoginDecisionDenyInteractionRequest } from '../../requests/interaction/login-decision-deny.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { LoginInteractionRequestValidator } from './login.interaction-request.validator';

jest.mock('../../logger/logger');

describe('Login Interaction Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: LoginInteractionRequestValidator;

  const loggerMock = jest.mocked(Logger.prototype);

  const settings = <Settings>{};

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const userServiceMock = jest.mocked<UserServiceInterface>({
    create: jest.fn(),
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

    container.bind(Logger).toValue(loggerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
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
    let parameters: LoginContextInteractionRequest;

    const requestFactory = (data: Partial<LoginContextInteractionRequest> = {}): HttpRequest => {
      removeNullishValues<LoginContextInteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/interaction?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      parameters = { interaction_type: 'login', login_challenge: 'login_challenge' };
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

    it('should return a login context interaction context.', async () => {
      const request = requestFactory();

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
      });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<LoginContextInteractionContext>({
        parameters,
        interactionType: interactionTypesMocks[1]!,
        grant,
      });
    });
  });

  describe('validateDecision()', () => {
    let parameters: LoginDecisionInteractionRequest;

    const requestFactory = (data: Partial<LoginDecisionInteractionRequest> = {}): HttpRequest => {
      removeNullishValues<LoginDecisionInteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/interaction'),
      });
    };

    beforeEach(() => {
      parameters = <LoginDecisionInteractionRequest>{ interaction_type: 'login', login_challenge: 'login_challenge' };
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

    it('should throw when not providing the parameter "decision".', async () => {
      const request = requestFactory({ decision: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "decision".',
      );
    });

    it('should throw when providing an unsupported decision.', async () => {
      const request = requestFactory({ decision: 'unknown' as LoginDecision });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported decision "unknown".',
      );
    });

    // #region Accept Decision
    it('should throw when not providing the parameter "subject".', async () => {
      const request = requestFactory({ decision: 'accept', subject: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "subject".',
      );
    });

    it('should throw when no user is found.', async () => {
      const request = requestFactory({ decision: 'accept', subject: 'user_id' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      userServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid User.',
      );
    });

    it('should return a login decision accept interaction context.', async () => {
      const request = requestFactory({
        decision: 'accept',
        subject: 'user_id',
        amr: 'pwd sms',
        acr: 'guarani:acr:2fa',
      });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);
      userServiceMock.findOne.mockResolvedValueOnce(user);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LoginDecisionAcceptInteractionContext>({
        parameters: parameters as LoginDecisionAcceptInteractionRequest,
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
    it('should throw when not providing the parameter "error".', async () => {
      const request = requestFactory({ decision: 'deny', error: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "error".',
      );
    });

    it('should throw when not providing the parameter "error_description".', async () => {
      const request = requestFactory({ decision: 'deny', error: 'login_denied', error_description: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "error_description".',
      );
    });

    it('should return a login decision deny interaction context.', async () => {
      const request = requestFactory({
        decision: 'deny',
        error: 'login_denied',
        error_description: 'Lorem ipsum dolor sit amet...',
      });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        client,
      });

      const error: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, [parameters.error_description as string]),
        { error: parameters.error as string },
      );

      grantServiceMock.findOneByLoginChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LoginDecisionDenyInteractionContext>({
        parameters: parameters as LoginDecisionDenyInteractionRequest,
        interactionType: interactionTypesMocks[1]!,
        grant,
        decision: 'deny',
        error,
      });
    });
    // #endregion
  });
});
