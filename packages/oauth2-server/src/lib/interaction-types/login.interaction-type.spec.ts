import { DependencyInjectionContainer } from '@guarani/di';

import { LoginContextInteractionContext } from '../context/interaction/login-context.interaction-context';
import { LoginDecisionInteractionContext } from '../context/interaction/login-decision.interaction-context';
import { LoginDecisionAcceptInteractionContext } from '../context/interaction/login-decision-accept.interaction-context';
import { LoginDecisionDenyInteractionContext } from '../context/interaction/login-decision-deny.interaction-context';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { UnmetAuthenticationRequirementsException } from '../exceptions/unmet-authentication-requirements.exception';
import { AuthHandler } from '../handlers/auth.handler';
import { LoginContextInteractionResponse } from '../responses/interaction/login-context.interaction-response';
import { LoginDecisionInteractionResponse } from '../responses/interaction/login-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { LoginInteractionType } from './login.interaction-type';
import { LoginDecision } from './login-decision.type';

jest.mock('../handlers/auth.handler');

describe('Login Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: LoginInteractionType;

  const authHandlerMock = jest.mocked(AuthHandler.prototype);

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const loginServiceMock = jest.mocked<LoginServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  });

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

    container.bind(AuthHandler).toValue(authHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<LoginServiceInterface>(LOGIN_SERVICE).toValue(loginServiceMock);
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

    beforeEach(() => {
      const now = Date.now();

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
        grant: <Grant>{
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
          client: { id: 'client_id' },
          session: {
            id: 'session_id',
            activeLogin: { id: 'login_id', createdAt: new Date(now - 3600000) },
            logins: [{ id: 'login_id', createdAt: new Date(now - 3600000) }],
          },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.'
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should return a valid first time login context response.', async () => {
      context.grant.session.activeLogin = null;
      context.grant.session.logins = [];

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

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
      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

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
      Reflect.set(context.grant.parameters, 'max_age', '86400');

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: true,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          acr_values: undefined,
          auth_exp: Math.floor((context.grant.session.activeLogin!.createdAt.getTime() + 86400000) / 1000),
          display: undefined,
          login_hint: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });
    });

    it('should return a valid login context response when the login is not within the elapsed "max_age" time.', async () => {
      Reflect.set(context.grant.parameters, 'max_age', '300');

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: false,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          acr_values: undefined,
          auth_exp: Math.floor((context.grant.session.activeLogin!.createdAt.getTime() + 300000) / 1000),
          display: undefined,
          login_hint: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });

      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledWith(context.grant.session);
    });
  });

  describe('handleDecision()', () => {
    let context: LoginDecisionInteractionContext<LoginDecision>;

    beforeEach(() => {
      const now = Date.now();

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
        grant: <Grant>{
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
          interactions: <InteractionType[]>[],
          expiresAt: new Date(now + 300000),
          client: { id: 'client_id' },
          session: {
            id: 'session_id',
            activeLogin: { id: 'login_id', createdAt: new Date(now - 3600000) },
            logins: [{ id: 'login_id', createdAt: new Date(now - 3600000) }],
          },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.'
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    // #region Accept Decision.
    it('should return an error response when the authorization server fails to meet the required "acr_values".', async () => {
      context.grant.session.activeLogin = null;
      context.grant.session.logins = [];

      Reflect.set(context.grant.parameters, 'acr_values', 'urn:guarani:acr:2fa');

      Object.assign(context.parameters, {
        decision: 'accept',
        subject: 'user_id',
        amr: 'pwd',
        acr: 'urn:guarani:acr:1fa',
      });

      Object.assign(context, {
        decision: 'accept',
        user: { id: 'user_id' },
        amr: ['pwd'],
        acr: 'urn:guarani:acr:1fa',
      });

      const error = new UnmetAuthenticationRequirementsException(
        'Could not authenticate using the Authentication Context Class Reference "urn:guarani:acr:2fa".'
      );

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should return a valid first time login accept decision interaction response.', async () => {
      context.grant.session.activeLogin = null;
      context.grant.session.logins = [];

      Object.assign(context.parameters, {
        decision: 'accept',
        subject: 'user_id',
        amr: 'pwd sms',
        acr: 'guarani:acr:2fa',
      });

      Object.assign(context, {
        decision: 'accept',
        user: { id: 'user_id' },
        amr: ['pwd', 'sms'],
        acr: 'guarani:acr:2fa',
      });

      const { acr, amr, user } = context as LoginDecisionAcceptInteractionContext;

      const login = <Login>{ id: 'login_id', acr, amr, user };

      loginServiceMock.create.mockResolvedValueOnce(login);

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(loginServiceMock.create).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.create).toHaveBeenCalledWith(user, context.grant.session, amr, acr);

      expect(authHandlerMock.updateActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.updateActiveLogin).toHaveBeenCalledWith(context.grant.session, login);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...context.grant, interactions: ['login'] });
    });

    it('should replace an old login and return a valid login accept decision interaction response.', async () => {
      const now = Date.now();

      const oldLogin = <Login>{ id: 'login_id', user: { id: 'user_id' }, createdAt: new Date(now - 86400) };

      context.grant.session.activeLogin = null;
      context.grant.session.logins = [oldLogin];

      Object.assign(context.parameters, {
        decision: 'accept',
        subject: 'user_id',
        amr: 'pwd sms',
        acr: 'guarani:acr:2fa',
      });

      Object.assign(context, {
        decision: 'accept',
        user: { id: 'user_id' },
        amr: ['pwd', 'sms'],
        acr: 'guarani:acr:2fa',
      });

      const { acr, amr, user } = context as LoginDecisionAcceptInteractionContext;

      const login = <Login>{ id: 'login_id', acr, amr, user, createdAt: new Date(now) };

      loginServiceMock.create.mockResolvedValueOnce(login);

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(loginServiceMock.create).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.create).toHaveBeenCalledWith(user, context.grant.session, amr, acr);

      expect(authHandlerMock.updateActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.updateActiveLogin).toHaveBeenCalledWith(context.grant.session, login);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...context.grant, interactions: ['login'] });
    });

    it('should return a valid subsequent login accept decision interaction response.', async () => {
      Object.assign(context.grant.session.activeLogin!, {
        acr: 'guarani:acr:2fa',
        amr: ['pwd', 'sms'],
        user: { id: 'user_id' },
      });

      Object.assign(context, {
        parameters: Object.assign(context.parameters, {
          decision: 'accept',
          subject: 'user_id',
          amr: 'pwd sms',
          acr: 'guarani:acr:2fa',
        }),
        decision: 'accept',
        user: { id: 'user_id' },
        amr: ['pwd', 'sms'],
        acr: 'guarani:acr:2fa',
      });

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(loginServiceMock.create).not.toHaveBeenCalled();
      expect(authHandlerMock.updateActiveLogin).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Deny Decision.
    it('should return a valid login deny decision interaction response.', async () => {
      Object.assign(context, {
        parameters: Object.assign(context.parameters, {
          decision: 'deny',
          error: 'login_denied',
          error_description: 'Lorem ipsum dolor sit amet...',
        }),
        decision: 'deny',
        error: Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
          Reflect.construct(OAuth2Exception, [context.parameters.error_description as string]),
          { error: context.parameters.error as string }
        ),
      });

      const { error } = context as LoginDecisionDenyInteractionContext;

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });
    // #endregion
  });
});
