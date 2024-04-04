import { DependencyInjectionContainer } from '@guarani/di';

import { LoginContextInteractionContext } from '../context/interaction/login-context.interaction-context';
import { LoginDecisionInteractionContext } from '../context/interaction/login-decision.interaction-context';
import { LoginDecisionAcceptInteractionContext } from '../context/interaction/login-decision-accept.interaction-context';
import { LoginDecisionDenyInteractionContext } from '../context/interaction/login-decision-deny.interaction-context';
import { Client } from '../entities/client.entity';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { UnmetAuthenticationRequirementsException } from '../exceptions/unmet-authentication-requirements.exception';
import { AuthHandler } from '../handlers/auth.handler';
import { Logger } from '../logger/logger';
import { LoginDecisionInteractionRequest } from '../requests/interaction/login-decision.interaction-request';
import { LoginDecisionAcceptInteractionRequest } from '../requests/interaction/login-decision-accept.interaction-request';
import { LoginDecisionDenyInteractionRequest } from '../requests/interaction/login-decision-deny.interaction-request';
import { LoginContextInteractionResponse } from '../responses/interaction/login-context.interaction-response';
import { LoginDecisionInteractionResponse } from '../responses/interaction/login-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { LoginInteractionType } from './login.interaction-type';
import { LoginDecision } from './login-decision.type';

jest.mock('../logger/logger');
jest.mock('../handlers/auth.handler');

describe('Login Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: LoginInteractionType;

  const loggerMock = jest.mocked(Logger.prototype);

  const authHandlerMock = jest.mocked(AuthHandler.prototype);

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(AuthHandler).toValue(authHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind(LoginInteractionType).toSelf().asSingleton();

    interactionType = container.resolve(LoginInteractionType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "login" as its name.', () => {
      expect(interactionType.name).toEqual<InteractionType>('login');
    });
  });

  describe('handleContext()', () => {
    let context: LoginContextInteractionContext;
    let client: Client;
    let login: Login;
    let session: Session;
    let grant: Grant;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login_id',
        createdAt: new Date(now - 3600000),
      });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      });

      grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar baz',
          state: 'client_state',
          response_mode: 'query',
        },
        expiresAt: new Date(now + 300000),
        client,
        session,
      });

      context = <LoginContextInteractionContext>{
        parameters: {
          interaction_type: 'login',
          login_challenge: 'login_challenge',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'login',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        },
        grant,
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return a valid first time login context response.', async () => {
      session.activeLogin = null;
      session.logins = [];

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: false,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          acr_values: undefined,
          auth_exp: undefined,
          display: undefined,
          login_hint: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });
    });

    it('should return a valid skip login context response when not providing a "max_age" authorization parameter.', async () => {
      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: true,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          acr_values: undefined,
          auth_exp: undefined,
          display: undefined,
          login_hint: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });
    });

    it('should return a valid skip login context response when the login is within the elapsed "max_age" time.', async () => {
      Reflect.set(grant.parameters, 'max_age', '86400');

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: true,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          acr_values: undefined,
          auth_exp: Math.floor((login.createdAt.getTime() + 86400000) / 1000),
          display: undefined,
          login_hint: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });
    });

    it('should return a valid login context response when the login is not within the elapsed "max_age" time.', async () => {
      Reflect.set(grant.parameters, 'max_age', '300');

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: false,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          acr_values: undefined,
          auth_exp: Math.floor((login.createdAt.getTime() + 300000) / 1000),
          display: undefined,
          login_hint: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });

      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledWith(session);
    });
  });

  describe('handleDecision()', () => {
    let context: LoginDecisionInteractionContext<LoginDecision>;
    let client: Client;
    let login: Login;
    let session: Session;
    let grant: Grant;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login_id',
        createdAt: new Date(now - 3600000),
      });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      });

      grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar baz',
          state: 'client_state',
          response_mode: 'query',
        },
        interactions: [],
        expiresAt: new Date(now + 300000),
        client,
        session,
      });

      context = <LoginDecisionInteractionContext<LoginDecision>>{
        parameters: {
          interaction_type: 'login',
          login_challenge: 'login_challenge',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'login',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        },
        grant,
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    // #region Accept Decision.
    it('should return an error response when the authorization server fails to meet the required "acr_values".', async () => {
      session.activeLogin = null;
      session.logins = [];

      Reflect.set(context.grant.parameters, 'acr_values', 'urn:guarani:acr:2fa');

      Object.assign<LoginDecisionInteractionRequest<LoginDecision>, Partial<LoginDecisionAcceptInteractionRequest>>(
        context.parameters,
        {
          decision: 'accept',
          subject: 'user_id',
          amr: 'pwd',
          acr: 'urn:guarani:acr:1fa',
        },
      );

      Object.assign<LoginDecisionInteractionContext<LoginDecision>, Partial<LoginDecisionAcceptInteractionContext>>(
        context,
        {
          decision: 'accept',
          user: { id: 'user_id' },
          amr: ['pwd'],
          acr: 'urn:guarani:acr:1fa',
        },
      );

      const error = new UnmetAuthenticationRequirementsException(
        'Could not authenticate using the Authentication Context Class Reference "urn:guarani:acr:2fa".',
      );

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return a valid first time login accept decision interaction response.', async () => {
      session.activeLogin = null;
      session.logins = [];

      Object.assign<LoginDecisionInteractionRequest<LoginDecision>, Partial<LoginDecisionAcceptInteractionRequest>>(
        context.parameters,
        {
          decision: 'accept',
          subject: 'user_id',
          amr: 'pwd sms',
          acr: 'guarani:acr:2fa',
        },
      );

      Object.assign<LoginDecisionInteractionContext<LoginDecision>, Partial<LoginDecisionAcceptInteractionContext>>(
        context,
        {
          decision: 'accept',
          user: { id: 'user_id' },
          amr: ['pwd', 'sms'],
          acr: 'guarani:acr:2fa',
        },
      );

      const { acr, amr, user } = context as LoginDecisionAcceptInteractionContext;

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(authHandlerMock.login).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.login).toHaveBeenCalledWith(user, client, session, amr, acr);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...grant, interactions: ['login'] });
    });

    it('should replace an old login and return a valid login accept decision interaction response.', async () => {
      const now = Date.now();

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const oldLogin: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login_id',
        user,
        createdAt: new Date(now - 86400),
      });

      session.activeLogin = null;
      session.logins = [oldLogin];

      Object.assign<LoginDecisionInteractionRequest<LoginDecision>, Partial<LoginDecisionAcceptInteractionRequest>>(
        context.parameters,
        {
          decision: 'accept',
          subject: 'user_id',
          amr: 'pwd sms',
          acr: 'guarani:acr:2fa',
        },
      );

      Object.assign<LoginDecisionInteractionContext<LoginDecision>, Partial<LoginDecisionAcceptInteractionContext>>(
        context,
        {
          decision: 'accept',
          user: { id: 'user_id' },
          amr: ['pwd', 'sms'],
          acr: 'guarani:acr:2fa',
        },
      );

      const { acr, amr } = context as LoginDecisionAcceptInteractionContext;

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(authHandlerMock.login).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.login).toHaveBeenCalledWith(user, client, session, amr, acr);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...grant, interactions: ['login'] });
    });

    it('should return a valid subsequent login accept decision interaction response.', async () => {
      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      Object.assign<Login, Partial<Login>>(login, {
        acr: 'guarani:acr:2fa',
        amr: ['pwd', 'sms'],
        user,
      });

      Object.assign<LoginDecisionInteractionContext<LoginDecision>, Partial<LoginDecisionAcceptInteractionContext>>(
        context,
        {
          parameters: Object.assign<
            LoginDecisionInteractionRequest<LoginDecision>,
            Partial<LoginDecisionAcceptInteractionRequest>
          >(context.parameters, {
            decision: 'accept',
            subject: 'user_id',
            amr: 'pwd sms',
            acr: 'guarani:acr:2fa',
          }),
          decision: 'accept',
          user,
          amr: ['pwd', 'sms'],
          acr: 'guarani:acr:2fa',
        },
      );

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(authHandlerMock.login).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Deny Decision.
    it('should return a valid login deny decision interaction response.', async () => {
      Object.assign<LoginDecisionInteractionContext<LoginDecision>, Partial<LoginDecisionDenyInteractionContext>>(
        context,
        {
          parameters: Object.assign<
            LoginDecisionInteractionRequest<LoginDecision>,
            Partial<LoginDecisionDenyInteractionRequest>
          >(context.parameters, {
            decision: 'deny',
            error: 'login_denied',
            error_description: 'Lorem ipsum dolor sit amet...',
          }),
          decision: 'deny',
          error: Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
            Reflect.construct(OAuth2Exception, [context.parameters.error_description as string]),
            { error: context.parameters.error as string },
          ),
        },
      );

      const { error } = context as LoginDecisionDenyInteractionContext;

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });
    // #endregion
  });
});
