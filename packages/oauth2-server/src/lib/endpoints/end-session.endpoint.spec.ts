import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { EndSessionContext } from '../context/end-session-context';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { EndSessionRequest } from '../requests/end-session-request';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../services/logout-ticket.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { EndSessionRequestValidator } from '../validators/end-session-request.validator';
import { EndSessionEndpoint } from './end-session.endpoint';
import { Endpoint } from './endpoint.type';

jest.mock('../handlers/id-token.handler');
jest.mock('../validators/end-session-request.validator');

describe('End Session Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: EndSessionEndpoint;

  const validatorMock = jest.mocked(EndSessionRequestValidator.prototype);

  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    userInteraction: { errorUrl: '/oauth/error', logoutUrl: '/auth/logout' },
    enableAuthorizationResponseIssuerIdentifier: false,
    postLogoutUrl: 'https://server.example.com',
  };

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const logoutTicketServiceMock = jest.mocked<LogoutTicketServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByLogoutChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(EndSessionRequestValidator).toValue(validatorMock);
    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<LogoutTicketServiceInterface>(LOGOUT_TICKET_SERVICE).toValue(logoutTicketServiceMock);
    container.bind(EndSessionEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(EndSessionEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "end_session" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('end_session');
    });
  });

  describe('path', () => {
    it('should have "/oauth/end_session" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/end_session');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET", "POST"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toEqual<HttpMethod[]>(['GET', 'POST']);
    });
  });

  describe('constructor', () => {
    it('should throw when not providing a user interaction object.', () => {
      const settings = <Settings>{ issuer: 'https://server.example.com' };

      container.delete<Settings>(SETTINGS);
      container.delete(EndSessionEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(EndSessionEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(EndSessionEndpoint)).toThrowWithMessage(
        TypeError,
        'Missing User Interaction options.'
      );
    });

    it('should throw when not providing a post logout url.', () => {
      const settings = <Settings>{
        issuer: 'https://server.example.com',
        userInteraction: { errorUrl: '/oauth/error' },
      };

      container.delete<Settings>(SETTINGS);
      container.delete(EndSessionEndpoint);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(EndSessionEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(EndSessionEndpoint)).toThrowWithMessage(TypeError, 'Missing Post Logout Url.');
    });
  });

  describe('handle()', () => {
    let parameters: EndSessionRequest;

    const requestFactory = (data: Partial<EndSessionRequest> = {}, cookies: Dictionary<unknown> = {}): HttpRequest => {
      removeNullishValues<EndSessionRequest>(Object.assign(parameters, data));

      cookies = removeNullishValues(
        Object.assign<Dictionary<unknown>, Dictionary<unknown>>(
          { 'guarani:session': 'session_id', 'guarani:logout': 'logout_ticket_id' },
          cookies
        )
      );

      return new HttpRequest({
        body: {},
        cookies,
        headers: {},
        method: 'GET',
        url: addParametersToUrl('https://server.example.com/oauth/end_session', parameters),
      });
    };

    beforeEach(() => {
      Reflect.deleteProperty(validatorMock, 'name');

      parameters = {
        id_token_hint: 'id_token_hint',
        client_id: 'client_id',
        post_logout_redirect_uri: 'https://client.example.com/oauth/logout_callback',
        state: 'client_state',
        logout_hint: 'johndoe@email.com',
        ui_locales: 'pt-BR en',
      };
    });

    it('should redirect to the error endpoint if the client presents a logout ticket not issued to itself.', async () => {
      const request = requestFactory();

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'another_client_id' },
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);

      const error = new InvalidRequestException('Mismatching Client Identifier.');
      const location = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should redirect to the error endpoint if the client presents an expired logout ticket.', async () => {
      const request = requestFactory();

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        parameters,
        expiresAt: new Date(Date.now() - 3600000),
        client: { id: 'client_id' },
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);

      const error = new InvalidRequestException('Expired Logout Ticket.');
      const location = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should redirect to the error endpoint if the initial parameters changed.', async () => {
      const request = requestFactory();

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        parameters: { ...parameters, state: 'another_client_state' },
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);

      const error = new InvalidRequestException('One or more parameters changed since the initial request.');
      const location = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should redirect to the error endpoint when the authenticated user does not match the user of "id_token_hint".', async () => {
      const request = requestFactory();

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: { id: 'login_id', user: { id: 'user_id' } },
        logins: [{ id: 'login_id', user: { id: 'user_id' } }],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(false);

      const error = new InvalidRequestException(
        'The currently authenticated User is not the one expected by the ID Token Hint.'
      );

      const location = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ Location: location.href });
    });

    it('should create a logout ticket and redirect to the logout endpoint when there is an active login.', async () => {
      const request = requestFactory({}, { 'guarani:logout': undefined });

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: { id: 'login_id', user: { id: 'user_id' } },
        logins: [{ id: 'login_id', user: { id: 'user_id' } }],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        logoutChallenge: 'logout_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);
      logoutTicketServiceMock.create.mockResolvedValueOnce(logoutTicket);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': logoutTicket.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/logout?logout_challenge=logout_challenge',
      });

      expect(logoutTicketServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should redirect to the logout endpoint when there is an active login.', async () => {
      const request = requestFactory();

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        logoutChallenge: 'logout_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: { id: 'login_id', user: { id: 'user_id' } },
        logins: [{ id: 'login_id', user: { id: 'user_id' } }],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': logoutTicket.id });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/auth/logout?logout_challenge=logout_challenge',
      });

      expect(logoutTicketServiceMock.create).not.toHaveBeenCalled();
    });

    it('should redirect to the post logout redirect uri and remove the session cookie.', async () => {
      const request = requestFactory({}, { 'guarani:session': undefined, 'guarani:logout': undefined });

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(null);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:session': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://client.example.com/oauth/logout_callback?state=client_state',
      });
    });

    it('should redirect to the post logout redirect uri and remove the logout ticket.', async () => {
      const request = requestFactory();

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        logoutChallenge: 'logout_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [{ id: 'login_id', user: { id: 'user_id' } }],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://client.example.com/oauth/logout_callback?state=client_state',
      });

      expect(logoutTicketServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(logoutTicketServiceMock.remove).toHaveBeenCalledWith(logoutTicket);
    });

    it('should redirect to the post logout redirect uri.', async () => {
      const request = requestFactory({}, { 'guarani:logout': undefined });

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        postLogoutRedirectUri: new URL('https://client.example.com/oauth/logout_callback'),
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        logoutChallenge: 'logout_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [{ id: 'login_id', user: { id: 'user_id' } }],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://client.example.com/oauth/logout_callback?state=client_state',
      });

      expect(logoutTicketServiceMock.remove).not.toHaveBeenCalled();
    });

    it('should redirect to the post logout url and remove the session cookie.', async () => {
      const request = requestFactory(
        { post_logout_redirect_uri: undefined },
        { 'guarani:session': undefined, 'guarani:logout': undefined }
      );

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      sessionServiceMock.findOne.mockResolvedValueOnce(null);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:session': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/?state=client_state',
      });
    });

    it('should redirect to the post logout url and remove the logout ticket.', async () => {
      const request = requestFactory({ post_logout_redirect_uri: undefined });

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        logoutChallenge: 'logout_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [{ id: 'login_id', user: { id: 'user_id' } }],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({ 'guarani:logout': null });
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/?state=client_state',
      });

      expect(logoutTicketServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(logoutTicketServiceMock.remove).toHaveBeenCalledWith(logoutTicket);
    });

    it('should redirect to the post logout url.', async () => {
      const request = requestFactory({ post_logout_redirect_uri: undefined }, { 'guarani:logout': undefined });

      const context = <EndSessionContext>{
        parameters,
        cookies: request.cookies,
        idTokenHint: 'id_token_hint',
        client: { id: 'client_id' },
        state: 'client_state',
        logoutHint: 'johndoe@email.com',
        uiLocales: ['pt-BR', 'en'],
      };

      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        logoutChallenge: 'logout_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: { id: 'client_id' },
      };

      const session = <Session>{
        id: 'session_id',
        activeLogin: null,
        logins: [{ id: 'login_id', user: { id: 'user_id' } }],
      };

      validatorMock.getEndSessionParameters.mockReturnValueOnce(request.query as EndSessionRequest);
      validatorMock.validate.mockResolvedValueOnce(context);
      logoutTicketServiceMock.findOne.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://server.example.com/?state=client_state',
      });

      expect(logoutTicketServiceMock.remove).not.toHaveBeenCalled();
    });
  });
});
