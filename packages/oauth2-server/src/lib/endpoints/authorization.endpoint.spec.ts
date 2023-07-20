import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { DisplayInterface } from '../displays/display.interface';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { AuthHandler } from '../handlers/auth.handler';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { InteractionType } from '../interaction-types/interaction-type.type';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { ResponseType } from '../response-types/response-type.type';
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
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { AuthorizationRequestValidator } from '../validators/authorization/authorization-request.validator';
import { AuthorizationEndpoint } from './authorization.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../handlers/auth.handler');
jest.mock('../handlers/id-token.handler');
jest.mock('../validators/authorization/authorization-request.validator');

describe('Authorization Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: AuthorizationEndpoint;

  const authHandlerMock = jest.mocked(AuthHandler.prototype);

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    scopes: ['foo', 'bar', 'baz', 'qux'],
    userInteraction: {
      consentUrl: '/auth/consent',
      errorUrl: '/oauth/error',
      loginUrl: '/auth/login',
      registrationUrl: '/auth/register',
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

  const validatorMock = jest.mocked(AuthorizationRequestValidator.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind(AuthHandler).toValue(authHandlerMock);
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
      expect(endpoint.httpMethods).toEqual<HttpMethod[]>(['GET']);
    });
  });

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      const settings = <Settings>{ issuer: 'https://server.example.com', scopes: ['foo', 'bar', 'baz', 'qux'] };

      container.delete<Settings>(SETTINGS);
      container.delete(AuthorizationEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(AuthorizationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(AuthorizationEndpoint)).toThrowWithMessage(
        TypeError,
        'Missing User Interaction options.'
      );
    });
  });

  describe('handle()', () => {
    let parameters: AuthorizationRequest;

    const requestFactory = (data: Partial<AuthorizationRequest> = {}): HttpRequest => {
      removeNullishValues<AuthorizationRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: addParametersToUrl('https://server.example.com/oauth/authorize', parameters),
      });
    };

    beforeEach(() => {
      Reflect.deleteProperty(validatorMock, 'name');

      parameters = {
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://client.example.com/oauth/callback',
        scope: 'foo bar',
        state: 'client_state',
      };
    });

    // #region Validator
    it('should redirect to the error endpoint when not providing a "response_type" parameter.', async () => {
      const request = requestFactory({ response_type: undefined });

      const error = new InvalidRequestException('Invalid parameter "response_type".');
      const location = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should redirect to the error endpoint when requesting an unsupported response type.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ response_type: 'unknown' as ResponseType });

      const error = new UnsupportedResponseTypeException('Unsupported response_type "unknown".');
      const location = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });
    // #endregion

    // #region Session and Login
    it('should redirect to the error endpoint if the client presents a grant not issued to itself.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new InvalidRequestException('Mismatching Client Identifier.');

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint if the grant is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new InvalidRequestException('Expired Grant.');

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint if the initial parameters changed.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new InvalidRequestException('One or more parameters changed since the initial request.');

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should reload the authorization endpoint if no session is found at the cookies.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      const context = <AuthorizationContext>{
        parameters,
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

      const location = addParametersToUrl('https://server.example.com/oauth/authorize', context.parameters);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:session': session.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(sessionServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should reload the authorization endpoint if no session is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'invalid_session_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const location = addParametersToUrl('https://server.example.com/oauth/authorize', context.parameters);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:session': session.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(sessionServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the registration endpoint if the prompt is "create" and it is not yet processed.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'create' });

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/register';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['create'],
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint if the prompt is "select_account" and no login is registered at the session.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'select_account' });

      request.cookies['guarani:session'] = 'session_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new LoginRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should create a grant and redirect to the select account endpoint if the prompt is "select_account" and no grant is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'select_account' });

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/select-account';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the select account endpoint if the prompt is "select_account" and it is not yet processed.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'select_account' });

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/select-account';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint when the prompt is "none" and no login is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'none' });

      request.cookies['guarani:session'] = 'session_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new LoginRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should create a grant and redirect to the login endpoint when no login is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the login endpoint when no login is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should remove the grant and redirect to the error endpoint when the prompt is "none" and the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'none' });

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new LoginRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.logout).toHaveBeenCalledWith(login, session);

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint when the prompt is "none" and the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'none' });

      request.cookies['guarani:session'] = 'session_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new LoginRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.logout).toHaveBeenCalledWith(login, session);

      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it('should create a grant and redirect to the login endpoint when the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.logout).toHaveBeenCalledWith(login, session);

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the login endpoint when the login is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.logout).toHaveBeenCalledWith(login, session);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should remove the grant and redirect to the error endpoint when the prompt is "none" and the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'none', max_age: '86400' });

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new LoginRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(authHandlerMock.inactivateSessionActiveLogin).not.toHaveBeenCalled();

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint when the prompt is "none" and the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'none', max_age: '86400' });

      request.cookies['guarani:session'] = 'session_id';

      const context = <AuthorizationContext>{
        parameters,
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

      const error = new LoginRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(authHandlerMock.inactivateSessionActiveLogin).not.toHaveBeenCalled();
      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it('should create a grant and redirect to the login endpoint when the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ max_age: '86400' });

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(authHandlerMock.inactivateSessionActiveLogin).not.toHaveBeenCalled();

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the login endpoint when the login is older than the "max_age".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ max_age: '86400' });

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(authHandlerMock.inactivateSessionActiveLogin).not.toHaveBeenCalled();
      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should remove the grant and redirect to the error endpoint when the authenticated user does not match the user of "id_token_hint".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ id_token_hint: 'header.payload.signature' });

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        maxAge: null,
        idTokenHint: 'header.payload.signature',
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      const error = new LoginRequiredException(
        'The currently authenticated User is not the one expected by the ID Token Hint.'
      );

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledWith(session);

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should redirect to the error endpoint when the authenticated user does not match the user of "id_token_hint".', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ id_token_hint: 'header.payload.signature' });

      request.cookies['guarani:session'] = 'session_id';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        maxAge: null,
        idTokenHint: 'header.payload.signature',
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      const error = new LoginRequiredException(
        'The currently authenticated User is not the one expected by the ID Token Hint.'
      );

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should create a grant and redirect to the login endpoint when the prompt is "login" and there is a previously authenticated user.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'login' });

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: ['login'],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the login endpoint when the prompt is "login" and there is a previously authenticated user with an unfinished grant.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'login' });

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/login?login_challenge=login_challenge';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        state: 'client_state',
        client: { id: 'client_id' },
        prompts: ['login'],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.inactivateSessionActiveLogin).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Consent
    it('should redirect to the error endpoint when the prompt is "none" and no consent is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'none' });

      request.cookies['guarani:session'] = 'session_id';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        state: 'client_state',
        client: { id: 'client_id' },
        prompts: ['none'],
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      const error = new ConsentRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should create a grant and redirect to the consent endpoint when no consent is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'login' });

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the consent endpoint when no consent is found.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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
        consent: null,
      };

      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(null);

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the error endpoint when the prompt is "none" and the consent is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory({ prompt: 'none' });

      request.cookies['guarani:session'] = 'session_id';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        state: 'client_state',
        client: { id: 'client_id' },
        prompts: ['none'],
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      const error = new ConsentRequiredException();

      const location = addParametersToUrl(
        'https://server.example.com/oauth/error',
        Object.assign(error.toJSON(), { state: 'client_state' })
      );

      const response = await endpoint.handle(request);

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should create a grant and redirect to the consent endpoint when the consent is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the consent endpoint when the consent is expired.', async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const redirectUrl = 'https://server.example.com/auth/consent?consent_challenge=consent_challenge';

      const context = <AuthorizationContext>{
        parameters,
        cookies: request.cookies,
        client: { id: 'client_id' },
        state: 'client_state',
        prompts: <Prompt[]>[],
        display: <DisplayInterface>{
          name: 'page',
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(redirectUrl)),
        },
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': grant.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: redirectUrl });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Response Types
    it("should remove the grant and redirect to the client's redirect uri with the authorization response.", async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const location = addParametersToUrl('https://client.example.com/oauth/callback', authorizationResponse);

      const context = <AuthorizationContext>{
        parameters,
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
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(location)),
        },
        prompts: <Prompt[]>[],
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it("should remove the grant and redirect to the client's redirect uri with the authorization response and the authorization server's issuer.", async () => {
      Reflect.set(validatorMock, 'name', 'code');
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';
      request.cookies['guarani:grant'] = 'grant_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const location = addParametersToUrl('https://client.example.com/oauth/callback', {
        ...authorizationResponse,
        iss: settings.issuer,
      });

      const context = <AuthorizationContext>{
        parameters,
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
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(location)),
        },
        prompts: <Prompt[]>[],
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:grant': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);

      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', false);
    });

    it("should redirect to the client's redirect uri with the authorization response.", async () => {
      Reflect.set(validatorMock, 'name', 'code');

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const location = addParametersToUrl('https://client.example.com/oauth/callback', authorizationResponse);

      const context = <AuthorizationContext>{
        parameters,
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
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(location)),
        },
        prompts: <Prompt[]>[],
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it("should redirect to the client's redirect uri with the authorization response and the authorization server's issuer.", async () => {
      Reflect.set(validatorMock, 'name', 'code');
      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', true);

      const request = requestFactory();

      request.cookies['guarani:session'] = 'session_id';

      const authorizationResponse: AuthorizationResponse = { code: 'code', state: 'client_state' };

      const location = addParametersToUrl('https://client.example.com/oauth/callback', {
        ...authorizationResponse,
        iss: settings.issuer,
      });

      const context = <AuthorizationContext>{
        parameters,
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
          createHttpResponse: jest.fn().mockReturnValueOnce(new HttpResponse().redirect(location)),
        },
        prompts: <Prompt[]>[],
        maxAge: null,
        idTokenHint: null,
      };

      const login = <Login>{
        id: 'login_id',
        createdAt: new Date(Date.now()),
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

      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });

      expect(grantServiceMock.remove).not.toHaveBeenCalled();

      Reflect.set(settings, 'enableAuthorizationResponseIssuerIdentifier', false);
    });
    // #endregion
  });
});
