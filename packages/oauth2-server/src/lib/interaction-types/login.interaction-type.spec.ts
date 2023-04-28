import { DependencyInjectionContainer } from '@guarani/di';

import { URLSearchParams } from 'url';

import { LoginContextInteractionContext } from '../context/interaction/login-context.interaction.context';
import { LoginDecisionAcceptInteractionContext } from '../context/interaction/login-decision-accept.interaction.context';
import { LoginDecisionDenyInteractionContext } from '../context/interaction/login-decision-deny.interaction.context';
import { LoginDecisionInteractionContext } from '../context/interaction/login-decision.interaction.context';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { LoginContextInteractionResponse } from '../responses/interaction/login-context.interaction-response';
import { LoginDecisionInteractionResponse } from '../responses/interaction/login-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { LoginDecision } from './login-decision.type';
import { LoginInteractionType } from './login.interaction-type';

describe('Login Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: LoginInteractionType;

  const settings = <Settings>{ issuer: 'https://server.example.com' };

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

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
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
        cookies: { 'guarani:grant': 'grant_id' },
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'login',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        }),
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
          session: { id: 'session_id', createdAt: new Date(now - 3600000) },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleContext(context)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Grant.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a valid first time login context response.', async () => {
      delete context.grant.session;

      const urlParameters = new URLSearchParams(context.grant.parameters);

      const response = await interactionType.handleContext(context);

      expect(response.statusCode).toBe(200);
      expect(response.cookies).toStrictEqual<Record<string, any>>({});

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<LoginContextInteractionResponse>({
        skip: false,
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        client: 'client_id',
        context: {},
      });
    });

    it('should return a valid skip login context response when not providing a "max_age" authorization parameter.', async () => {
      Reflect.set(context.grant, 'session', { id: 'session_id' });

      const urlParameters = new URLSearchParams(context.grant.parameters);

      const response = await interactionType.handleContext(context);

      expect(response.statusCode).toBe(200);
      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': context.grant.session!.id });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<LoginContextInteractionResponse>({
        skip: true,
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        client: 'client_id',
        context: {},
      });
    });

    it('should return a valid skip login context response when the session is within the elapsed "max_age" time.', async () => {
      Reflect.set(context.grant.parameters, 'max_age', '86400');

      const urlParameters = new URLSearchParams(context.grant.parameters);

      const response = await interactionType.handleContext(context);

      expect(response.statusCode).toBe(200);
      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': context.grant.session!.id });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<LoginContextInteractionResponse>({
        skip: true,
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        client: 'client_id',
        context: {
          auth_exp: Math.floor((context.grant.session!.createdAt.getTime() + 86400000) / 1000),
        },
      });
    });

    it('should return a valid login context response when the session is not within the elapsed "max_age" time.', async () => {
      Reflect.set(context.grant.parameters, 'max_age', '300');

      const urlParameters = new URLSearchParams(context.grant.parameters);

      const response = await interactionType.handleContext(context);

      expect(response.statusCode).toBe(200);
      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': context.grant.session!.id });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<LoginContextInteractionResponse>({
        skip: false,
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        client: 'client_id',
        context: {
          auth_exp: Math.floor((context.grant.session!.createdAt.getTime() + 300000) / 1000),
        },
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith({
        id: 'session_id',
        createdAt: new Date(context.grant.session!.createdAt.getTime()),
      });
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
          decision: <LoginDecision>'',
        },
        cookies: { 'guarani:grant': 'grant_id' },
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'login',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        }),
        decision: <LoginDecision>'',
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
          session: { id: 'session_id', createdAt: new Date(now - 3600000) },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Grant.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    // #region Accept Decision.
    it('should return a valid first time login accept decision interaction response.', async () => {
      delete context.grant.session;

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

      const { acr, amr, user } = <LoginDecisionAcceptInteractionContext>context;

      const session = <Session>{ id: 'session_id', acr, amr, user };

      sessionServiceMock.create.mockResolvedValueOnce(session);

      const urlParameters = new URLSearchParams(context.grant.parameters);

      const response = await interactionType.handleDecision(context);

      expect(response.statusCode).toBe(200);
      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': session.id });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
      });

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...context.grant, session });
    });

    it('should return a valid subsequent login accept decision interaction response.', async () => {
      Object.assign(context.grant.session!, {
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

      const urlParameters = new URLSearchParams(context.grant.parameters);

      const response = await interactionType.handleDecision(context);

      expect(response.statusCode).toBe(200);
      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': context.grant.session!.id });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
      });

      expect(sessionServiceMock.create).not.toHaveBeenCalled();
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
        error: Object.assign(
          Reflect.construct(OAuth2Exception, [{ description: context.parameters.error_description }]),
          { code: context.parameters.error }
        ),
      });

      const { error } = <LoginDecisionDenyInteractionContext>context;

      const urlParameters = new URLSearchParams(error.toJSON());

      const response = await interactionType.handleDecision(context);

      expect(response.statusCode).toBe(200);
      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual<LoginDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/error?${urlParameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });
    // #endregion
  });
});
