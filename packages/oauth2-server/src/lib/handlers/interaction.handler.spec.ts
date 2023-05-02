import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';
import { URL, URLSearchParams } from 'url';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { DisplayInterface } from '../displays/display.interface';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { HttpResponse } from '../http/http.response';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
import { IdTokenHandler } from './id-token.handler';
import { InteractionHandler } from './interaction.handler';

jest.mock('./id-token.handler');

type Entities = [Grant | null, Session, Consent];

describe('Interaction Handler', () => {
  let container: DependencyInjectionContainer;
  let handler: InteractionHandler;

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype, true);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    userInteraction: { consentUrl: '/auth/consent', errorUrl: '/oauth/error', loginUrl: '/auth/login' },
  };

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const consentServiceMock = jest.mocked<ConsentServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<ConsentServiceInterface>(CONSENT_SERVICE).toValue(consentServiceMock);
    container.bind(InteractionHandler).toSelf().asSingleton();

    handler = container.resolve(InteractionHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      const settings = <Settings>{};

      container.delete<Settings>(SETTINGS);
      container.delete(InteractionHandler);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(InteractionHandler).toSelf().asSingleton();

      expect(() => container.resolve(InteractionHandler)).toThrow(new TypeError('Missing User Interaction options.'));
    });
  });

  describe('getEntitiesOrHttpResponse()', () => {
    let context: AuthorizationContext<AuthorizationRequest>;

    beforeEach(() => {
      context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>{ state: 'client_state', display: 'page' },
        cookies: {},
        client: { id: 'client_id' },
        state: 'client_state',
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn((redirectUri, parameters) => {
            const url = new URL(redirectUri);
            const urlParameters = new URLSearchParams(parameters);
            url.search = urlParameters.toString();
            return new HttpResponse().redirect(url);
          }),
        },
        prompts: <Prompt[]>[],
      };
    });

    // #region Session Validation
    it('should redirect to the error endpoint if the client provided a grant not issued to itself.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'another_client_id' },
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({
        description: 'Mismatching Client Identifier.',
        state: 'client_state',
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': null });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint if the grant is expired.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() - 300000),
        client: context.client,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({ description: 'Expired Grant.', state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': null });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint if the initial parameters changed.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: { ...context.parameters, state: 'another_client_state' },
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
        state: 'client_state',
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': null });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint when the prompt is "none" and no session is found.', async () => {
      Reflect.set(context.parameters, 'prompt', 'none');
      Reflect.set(context, 'prompts', ['none']);

      const error = new LoginRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': null });

      expect(response.body).toEqual(Buffer.alloc(0));
    });

    it('should create a grant and redirect to the login endpoint if no session is found.', async () => {
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the login endpoint if no session is found.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint when the prompt is "none" and the session is expired.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'prompt', 'none');
      Reflect.set(context, 'prompts', ['none']);

      const session = <Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() - 3600000),
        user: { id: 'user_id' },
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const error = new LoginRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': null });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);
    });

    it('should create a grant and redirect to the login endpoint when the session is expired.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      const session = <Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() - 3600000),
        user: { id: 'user_id' },
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      const removeSessionOrder = sessionServiceMock.remove.mock.invocationCallOrder[0]!;
      const createGrantOrder = grantServiceMock.create.mock.invocationCallOrder[0]!;

      expect(removeSessionOrder).toBeLessThan(createGrantOrder);
    });

    it('should redirect to the login endpoint when the session is expired.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';
      context.cookies['guarani:session'] = 'session_id';

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      const session = <Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() - 3600000),
        user: { id: 'user_id' },
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint when the prompt is "none" and the session is older than the "max_age".', async () => {
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'prompt', 'none');
      Reflect.set(context.parameters, 'max_age', 86400);
      Reflect.set(context, 'prompts', ['none']);
      Reflect.set(context, 'maxAge', 86400);

      const session = <Session>{
        id: 'session_id',
        createdAt: new Date(Date.now() - 1296000000),
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const error = new LoginRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': null });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);
    });

    it('should create a grant and redirect to the login endpoint when the session is older than the "max_age".', async () => {
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'max_age', 86400);
      Reflect.set(context, 'maxAge', 86400);

      const session = <Session>{
        id: 'session_id',
        createdAt: new Date(Date.now() - 1296000000),
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      const removeSessionOrder = sessionServiceMock.remove.mock.invocationCallOrder[0]!;
      const createGrantOrder = grantServiceMock.create.mock.invocationCallOrder[0]!;

      expect(removeSessionOrder).toBeLessThan(createGrantOrder);
    });

    it('should redirect to the login endpoint when the session is older than the "max_age".', async () => {
      context.cookies['guarani:grant'] = 'grant_id';
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'max_age', 86400);
      Reflect.set(context, 'maxAge', 86400);

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      const session = <Session>{
        id: 'session_id',
        createdAt: new Date(Date.now() - 1296000000),
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint when the authenticated user does not match the user of "id_token_hint".', async () => {
      context.cookies['guarani:grant'] = 'grant_id';
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'id_token_hint', 'id_token');
      Reflect.set(context, 'idTokenHint', 'id_token');

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      const session = <Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(false);

      const error = new LoginRequiredException({
        description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
        state: 'client_state',
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null, 'guarani:session': null });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the login endpoint when the prompt is "login" and there is an authenticated user.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'prompt', 'login');
      Reflect.set(context, 'prompts', ['login']);

      const session = <Session>{ id: 'session_id' };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      const removeSessionOrder = sessionServiceMock.remove.mock.invocationCallOrder[0]!;
      const createGrantOrder = grantServiceMock.create.mock.invocationCallOrder[0]!;

      expect(removeSessionOrder).toBeLessThan(createGrantOrder);
    });

    it('should redirect to the login endpoint when the prompt is "login" and there is an authenticated user with a previous unfinished grant.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'prompt', 'login');
      Reflect.set(context, 'prompts', ['login']);

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      const session = <Session>{ id: 'session_id' };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/login?login_challenge=login_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Consent Validation
    it('should redirect to the error endpoint when the prompt is "none" and no consent is found.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'prompt', 'none');
      Reflect.set(context, 'prompts', ['none']);

      const session = <Session>{
        id: 'session_id',
        user: { id: 'user_id' },
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      const error = new ConsentRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({});

      expect(response.body).toEqual(Buffer.alloc(0));
    });

    it('should create a grant and redirect to the consent endpoint if no consent is found.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      const session = <Session>{
        id: 'session_id',
        user: { id: 'user_id' },
      };

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/consent?consent_challenge=consent_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the consent endpoint if no consent is found.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';
      context.cookies['guarani:session'] = 'session_id';

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      const session = <Session>{
        id: 'session_id',
        user: { id: 'user_id' },
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/consent?consent_challenge=consent_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint if the prompt is "none" and the consent is expired.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      Reflect.set(context.parameters, 'prompt', 'none');
      Reflect.set(context, 'prompts', ['none']);

      const session = <Session>{
        id: 'session_id',
        user: { id: 'user_id' },
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 3600000),
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const error = new ConsentRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${errorParameters.toString()}`,
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({});

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.create).not.toHaveBeenCalled();

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(consent);
    });

    it('should create a grant and redirect to the consent endpoint if the consent is expired.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      const session = <Session>{
        id: 'session_id',
        user: { id: 'user_id' },
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 3600000),
      };

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/consent?consent_challenge=consent_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(consent);

      const removeConsentOrder = consentServiceMock.remove.mock.invocationCallOrder[0]!;
      const createGrantOrder = grantServiceMock.create.mock.invocationCallOrder[0]!;

      expect(removeConsentOrder).toBeLessThan(createGrantOrder);
    });

    it('should redirect to the consent endpoint if the consent is expired.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';
      context.cookies['guarani:session'] = 'session_id';

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      const session = <Session>{
        id: 'session_id',
        user: { id: 'user_id' },
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 3600000),
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const response = (await handler.getEntitiesOrHttpResponse(context)) as HttpResponse;

      expect(response.statusCode).toBe(303);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/consent?consent_challenge=consent_challenge',
      });

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });

      expect(response.body).toEqual(Buffer.alloc(0));

      expect(grantServiceMock.create).not.toHaveBeenCalled();

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(consent);
    });

    it('should return the entities of the interaction process with a null grant.', async () => {
      context.cookies['guarani:session'] = 'session_id';

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };
      const consent = <Consent>{ id: 'consent_id' };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const [expectedGrant, expectedSession, expectedConsent] = <Entities>(
        await handler.getEntitiesOrHttpResponse(context)
      );

      expect(expectedGrant).toBeNull();
      expect(expectedSession).toStrictEqual(session);
      expect(expectedConsent).toStrictEqual(consent);
    });

    it('should return the entities of the interaction process.', async () => {
      context.cookies['guarani:grant'] = 'grant_id';
      context.cookies['guarani:session'] = 'session_id';

      const grant = <Grant>{
        id: 'grant_id',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };
      const consent = <Consent>{ id: 'consent_id' };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const [expectedGrant, expectedSession, expectedConsent] = <Entities>(
        await handler.getEntitiesOrHttpResponse(context)
      );

      expect(expectedGrant).toStrictEqual(grant);
      expect(expectedSession).toStrictEqual(session);
      expect(expectedConsent).toStrictEqual(consent);
    });
    // #endregion
  });
});
