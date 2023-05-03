import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';
import { URL, URLSearchParams } from 'url';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { DisplayInterface } from '../displays/display.interface';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { InteractionType } from '../interaction-types/interaction-type.type';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { AuthorizationResponse } from '../responses/authorization/authorization-response';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
import { AuthorizationRequestValidator } from '../validators/authorization/authorization-request.validator';
import { AuthorizationEndpoint } from './authorization.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../handlers/id-token.handler');
jest.mock('../validators/authorization/authorization-request.validator');

describe('Authorization Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: AuthorizationEndpoint;

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype, true);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    scopes: ['foo', 'bar', 'baz', 'qux'],
    userInteraction: {
      consentUrl: '/auth/consent',
      errorUrl: '/oauth/error',
      loginUrl: '/auth/login',
      selectAccountUrl: '/auth/select-account',
    },
    enableAuthorizationResponseIssuerIdentifier: false,
  };

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

  const consentServiceMock = jest.mocked<ConsentServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const validatorMock = jest.mocked(AuthorizationRequestValidator.prototype, true);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<LoginServiceInterface>(LOGIN_SERVICE).toValue(loginServiceMock);
    container.bind<ConsentServiceInterface>(CONSENT_SERVICE).toValue(consentServiceMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind(AuthorizationRequestValidator).toValue(validatorMock);
    container.bind(AuthorizationEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(AuthorizationEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "authorization" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('authorization');
    });
  });

  describe('path', () => {
    it('should have "/oauth/authorize" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/authorize');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['GET']);
    });
  });

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      const settings = <Settings>{ issuer: 'https://server.example.com', scopes: ['foo', 'bar', 'baz', 'qux'] };

      container.delete<Settings>(SETTINGS);
      container.delete(AuthorizationEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(AuthorizationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(AuthorizationEndpoint)).toThrow(
        new TypeError('Missing User Interaction options.')
      );
    });
  });

  describe('handle()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      Reflect.deleteProperty(validatorMock, 'name');

      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/authorize',
        query: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar',
          state: 'client_state',
        },
      });
    });

    // #region Validator
    it('should redirect to the error endpoint when not providing a "response_type" parameter.', async () => {
      delete request.query.response_type;

      const error = new InvalidRequestException({ description: 'Invalid parameter "response_type".' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });
    });

    it('should redirect to the error endpoint when requesting an unsupported response type.', async () => {
      request.query.response_type = 'unknown';

      const error = new UnsupportedResponseTypeException({ description: 'Unsupported response_type "unknown".' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });
    });
    // #endregion

    // #region Session and Login
    it('should redirect to the error endpoint if the client presents a grant not issued to itself.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
      };

      const grant = <Grant>{
        id: 'grant_id',
        client: { id: 'another_client_id' },
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({
        description: 'Mismatching Client Identifier.',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint if the grant is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
      };

      const grant = <Grant>{
        id: 'grant_id',
        expiresAt: new Date(Date.now() - 3600000),
        client: { id: 'client_id' },
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({ description: 'Expired Grant.', state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint if the initial parameters changed.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
      };

      const grant = <Grant>{
        id: 'grant_id',
        parameters: { ...context.parameters, state: 'another_client_state' },
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should reload the authorization endpoint if no session is found at the cookies.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [],
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.create.mockResolvedValueOnce(session);

      const parameters = new URLSearchParams(context.parameters);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': session.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/authorize?${parameters.toString()}`,
      });

      expect(sessionServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should reload the authorization endpoint if no session is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'invalid_session_id';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [],
      };

      validatorMock.validate.mockResolvedValueOnce(context);

      sessionServiceMock.findOne.mockResolvedValueOnce(null);
      sessionServiceMock.create.mockResolvedValueOnce(session);

      const parameters = new URLSearchParams(context.parameters);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:session': session.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/authorize?${parameters.toString()}`,
      });

      expect(sessionServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the error endpoint if the prompt is "select_account" and no login is registered at the session.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.query.prompt = 'select_account';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['select_account'],
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [],
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });
    });

    it('should create a grant and redirect to the select account endpoint if the prompt is "select_account" and no grant is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.query.prompt = 'select_account';

      const redirectUrl = 'https://server.example.com/auth/select-account';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['select_account'],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{ id: 'login_id' };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the select account endpoint if the prompt is "select_account" and it is not yet processed.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      request.query.prompt = 'select_account';

      const redirectUrl = 'https://server.example.com/auth/select-account';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['select_account'],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{ id: 'login_id' };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint when the prompt is "none" and no login is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.query.prompt = 'none';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['none'],
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [],
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });
    });

    it('should create a grant and redirect to the login endpoint when no login is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the login endpoint when no login is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should remove the grant and redirect to the error endpoint when the prompt is "none" and the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      request.query.prompt = 'none';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['none'],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() - 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should redirect to the error endpoint when the prompt is "none" and the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      request.query.prompt = 'none';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['none'],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() - 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.remove).not.toHaveBeenCalled();

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should create a grant and redirect to the login endpoint when the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() - 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should redirect to the login endpoint when the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() - 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should remove the grant and redirect to the error endpoint when the prompt is "none" and the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      request.query.prompt = 'none';
      request.query.max_age = '86400';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['none'],
        maxAge: 86400,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now() - 1296000000),
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should redirect to the error endpoint when the prompt is "none" and the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      request.query.prompt = 'none';
      request.query.max_age = '86400';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['none'],
        maxAge: 86400,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now() - 1296000000),
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      const error = new LoginRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });

      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it('should create a grant and redirect to the login endpoint when the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.query.max_age = '86400';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: 86400,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now() - 1296000000),
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should redirect to the login endpoint when the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      request.query.max_age = '86400';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: 86400,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now() - 1296000000),
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should remove the grant and redirect to the error endpoint when the authenticated user does not match the user of "id_token_hint".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      request.query.id_token_hint = 'id_token_hint';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        idTokenHint: 'id_token_hint',
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(false);

      const error = new LoginRequiredException({
        description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should redirect to the error endpoint when the authenticated user does not match the user of "id_token_hint".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      request.query.id_token_hint = 'id_token_hint';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        idTokenHint: 'id_token_hint',
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(false);

      const error = new LoginRequiredException({
        description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
        state: 'client_state',
      });

      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });

      expect(grantServiceMock.create).not.toHaveBeenCalled();

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should create a grant and redirect to the login endpoint when the prompt is "login" and there is a previously authenticated user.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.query.prompt = 'login';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['login'],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });

    it('should redirect to the login endpoint when the prompt is "login" and there is a previously authenticated user with an unfinished grant.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      request.query.prompt = 'login';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        state: 'client_state',
        client: { id: 'client_id' },
        prompts: ['login'],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });
    // #endregion

    // #region Consent
    it('should redirect to the error endpoint when the prompt is "none" and no consent is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.query.prompt = 'none';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        state: 'client_state',
        client: { id: 'client_id' },
        prompts: ['none'],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      const error = new ConsentRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });
    });

    it('should create a grant and redirect to the consent endpoint when no consent is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      request.query.prompt = 'login';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the consent endpoint when no consent is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint when the prompt is "none" and the consent is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.query.prompt = 'none';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        state: 'client_state',
        client: { id: 'client_id' },
        prompts: ['none'],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 3600000),
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const error = new ConsentRequiredException({ state: 'client_state' });
      const parameters = new URLSearchParams(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: `https://server.example.com/oauth/error?${parameters.toString()}`,
      });
    });

    it('should create a grant and redirect to the consent endpoint when the consent is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 3600000),
      };

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the consent endpoint when the consent is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() - 3600000),
      };

      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Response Types
    it("should remove the grant and redirect to the client's redirect uri with the authorization response.", async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const redirectUri = new URL('https://client.example.com/oauth/callback');
      const parameters = new URLSearchParams(authorizationResponse);

      redirectUri.search = parameters.toString();

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        responseType: <ResponseTypeInterface>{
          name: 'code',
          defaultResponseMode: 'query',
          handle: jest.fn().mockResolvedValueOnce(authorizationResponse),
        },
        client: { id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        state: 'client_state',
        responseMode: <ResponseModeInterface>{
          name: 'query',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUri)),
        },
        prompts: <Prompt[]>[],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const grant = <Grant>{
        id: 'grant_id',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUri.href });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it("should remove the grant and redirect to the client's redirect uri with the authorization response and the authorization server's issuer.", async () => {
      Reflect.set(validatorMock, 'name', 'code');
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const redirectUri = new URL('https://client.example.com/oauth/callback');
      const parameters = new URLSearchParams({ ...authorizationResponse, iss: settings.issuer });

      redirectUri.search = parameters.toString();

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        responseType: <ResponseTypeInterface>{
          name: 'code',
          defaultResponseMode: 'query',
          handle: jest.fn().mockResolvedValueOnce(authorizationResponse),
        },
        client: { id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        state: 'client_state',
        responseMode: <ResponseModeInterface>{
          name: 'query',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUri)),
        },
        prompts: <Prompt[]>[],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const grant = <Grant>{
        id: 'grant_id',
        parameters: context.parameters,
        interactions: <InteractionType[]>[],
        expiresAt: new Date(Date.now() + 3600000),
        client: context.client,
        session,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUri.href });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);

      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', false);
    });

    it("should redirect to the client's redirect uri with the authorization response.", async () => {
      Reflect.set(validatorMock, 'name', 'code');

      request.cookies['guarani:session'] = 'session_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const redirectUri = new URL('https://client.example.com/oauth/callback');
      const parameters = new URLSearchParams(authorizationResponse);

      redirectUri.search = parameters.toString();

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        responseType: <ResponseTypeInterface>{
          name: 'code',
          defaultResponseMode: 'query',
          handle: jest.fn().mockResolvedValueOnce(authorizationResponse),
        },
        client: { id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        state: 'client_state',
        responseMode: <ResponseModeInterface>{
          name: 'query',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUri)),
        },
        prompts: <Prompt[]>[],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() + 3600000),
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUri.href });

      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it("should redirect to the client's redirect uri with the authorization response and the authorization server's issuer.", async () => {
      Reflect.set(validatorMock, 'name', 'code');
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      request.cookies['guarani:session'] = 'session_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const redirectUri = new URL('https://client.example.com/oauth/callback');
      const parameters = new URLSearchParams({ ...authorizationResponse, iss: settings.issuer });

      redirectUri.search = parameters.toString();

      const context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: <AuthorizationRequest>request.query,
        cookies: request.cookies,
        responseType: <ResponseTypeInterface>{
          name: 'code',
          defaultResponseMode: 'query',
          handle: jest.fn().mockResolvedValueOnce(authorizationResponse),
        },
        client: { id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        state: 'client_state',
        responseMode: <ResponseModeInterface>{
          name: 'query',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUri)),
        },
        prompts: <Prompt[]>[],
      };

      const login = <Login>{
        id: 'login_id',
        expiresAt: new Date(Date.now() + 3600000),
        user: { id: 'user_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      };

      const consent = <Consent>{
        id: 'consent_id',
        expiresAt: new Date(Date.now() + 3600000),
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Record<string, any>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUri.href });

      expect(grantServiceMock.remove).not.toHaveBeenCalled();

      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', false);
    });
    // #endregion
  });
});
