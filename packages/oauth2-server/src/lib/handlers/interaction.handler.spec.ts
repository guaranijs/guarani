import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { URLSearchParams } from 'url';

import { DisplayInterface } from '../displays/display.interface';
import { DISPLAY } from '../displays/display.token';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpResponse } from '../http/http.response';
import { PromptInterface } from '../prompts/prompt.interface';
import { PROMPT } from '../prompts/prompt.token';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { InteractionHandler } from './interaction.handler';

type Entities = [Grant | null, Session, Consent];

describe('Interaction Handler', () => {
  let handler: InteractionHandler;

  const promptsMocks = [
    jest.mocked<PromptInterface>({ name: 'none', handle: jest.fn() }),
    jest.mocked<PromptInterface>({ name: 'login', handle: jest.fn() }),
    jest.mocked<PromptInterface>({ name: 'consent', handle: jest.fn() }),
  ];

  const displaysMocks = [jest.mocked<DisplayInterface>({ name: 'page', createHttpResponse: jest.fn() })];

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
    const container = new DependencyInjectionContainer();

    promptsMocks.forEach((promptMock) => container.bind<PromptInterface>(PROMPT).toValue(promptMock));
    displaysMocks.forEach((displayMock) => container.bind<DisplayInterface>(DISPLAY).toValue(displayMock));
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
      expect(() => {
        return new InteractionHandler(
          promptsMocks,
          displaysMocks,
          <Settings>{},
          grantServiceMock,
          sessionServiceMock,
          consentServiceMock
        );
      }).toThrow(new TypeError('Missing User Interaction options.'));
    });
  });

  describe('getEntitiesOrHttpResponse()', () => {
    let parameters: AuthorizationRequest;
    let cookies: Record<string, any>;

    beforeEach(() => {
      parameters = <AuthorizationRequest>{ state: 'client_state' };
      cookies = {};
    });

    it('should return an error response when authentication is required.', async () => {
      const client = <Client>{ id: 'client_id' };

      const error = new LoginRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, ['none'])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${errorParameters.toString()}` },
        cookies: {},
        statusCode: 303,
      });
    });

    it('should return an error response when authorization is required.', async () => {
      const client = <Client>{ id: 'client_id' };

      const error = new ConsentRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, ['none'])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${errorParameters.toString()}` },
        cookies: {},
        statusCode: 303,
      });
    });

    it('should return an error response for a generic error with a previous authorization.', async () => {
      const client = <Client>{ id: 'client_id' };

      const error = new ServerErrorException({ description: 'An unexpected error occurred.', state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, ['none'])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${errorParameters.toString()}` },
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        statusCode: 303,
      });
    });

    it('should return an error response for a generic error.', async () => {
      const client = <Client>{ id: 'client_id' };

      const error = new ServerErrorException({ description: 'An unexpected error occurred.', state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, ['none'])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${errorParameters.toString()}` },
        cookies: { 'guarani:grant': null, 'guarani:session': null, 'guarani:consent': null },
        statusCode: 303,
      });
    });

    // #region Not authenticated and not authorized.
    it('should return a redirect response to the login endpoint when starting a fresh authorization process.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge', parameters, client };

      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/login?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': null },
        statusCode: 303,
      });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the login endpoint when not authenticating at the login endpoint.', async () => {
      cookies['guarani:grant'] = 'grant_id';

      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge', parameters, client };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/login?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': null },
        statusCode: 303,
      });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should return an error response if the client of the request does not match the client of the grant.', async () => {
      cookies['guarani:grant'] = 'grant_id';

      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters,
        client: { id: 'another_client_id' },
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({
        description: 'Mismatching Client Identifier.',
        state: parameters.state,
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${errorParameters.toString()}` },
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return an error response if the grant is expired.', async () => {
      cookies['guarani:grant'] = 'grant_id';

      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters,
        expiresAt: new Date(Date.now() - 300000),
        client,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({ description: 'Expired Grant.', state: parameters.state });
      const errorParameters = new URLSearchParams(error.toJSON());

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${errorParameters.toString()}` },
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return an error response if one or more parameters changed during the interactions.', async () => {
      cookies['guarani:grant'] = 'grant_id';

      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: { ...parameters, state: 'another_client_state' },
        expiresAt: new Date(Date.now() + 300000),
        client,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
        state: parameters.state,
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${errorParameters.toString()}` },
        cookies: { 'guarani:grant': null, 'guarani:session': null },
        statusCode: 303,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it("should return a redirect response to the login endpoint if the user authenticated but did not authorize before the session's expiration time.", async () => {
      cookies['guarani:grant'] = 'grant_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id', expiresAt: new Date(Date.now() - 300000) };
      const grant = <Grant>{ id: 'grant_id', loginChallenge: 'login_challenge', parameters, client, session };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/login?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': null },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);
    });

    it('should return a redirect response to the consent endpoint if not previously authorized.', async () => {
      cookies['guarani:grant'] = 'grant_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/consent?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': grant.session!.id, 'guarani:consent': null },
        statusCode: 303,
      });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });

    it('should return a redirect response to the consent enddpoint if the consent is expired.', async () => {
      cookies['guarani:grant'] = 'grant_id';
      cookies['guarani:session'] = 'session_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id', expiresAt: new Date(Date.now() - 300000) };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/consent?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null },
        statusCode: 303,
      });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(grant.consent!);
    });

    it('should return the entities of the interaction.', async () => {
      cookies['guarani:grant'] = 'grant_id';
      cookies['guarani:session'] = 'session_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toEqual<Entities>([
        grant,
        session,
        grant.consent!,
      ]);
    });
    // #endregion

    // #region Authenticated but not authorized.
    it('should return a redirect response to the consent endpoint when previously authenticated but not authorized.', async () => {
      cookies['guarani:session'] = 'session_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/consent?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null },
        statusCode: 303,
      });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith({ ...grant, session });
    });

    it('should return a redirect response to the consent endpoint when previously authenticated but did not decide at the consent endpoint.', async () => {
      cookies['guarani:grant'] = 'grant_id';
      cookies['guarani:session'] = 'session_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/consent?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null },
        statusCode: 303,
      });

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });

    it('should return a redirect response to the consent endpoint when previously authenticated but did not authorize and the consent expired.', async () => {
      cookies['guarani:grant'] = 'grant_id';
      cookies['guarani:session'] = 'session_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id', expiresAt: new Date(Date.now() - 300000) };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/consent?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null },
        statusCode: 303,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(grant.consent!);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });

    it('should return the entities of the interaction.', async () => {
      cookies['guarani:grant'] = 'grant_id';
      cookies['guarani:session'] = 'session_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toEqual<Entities>([
        grant,
        session,
        grant.consent!,
      ]);
    });
    // #endregion

    // #region Not authenticated but authorized.
    it('should return a redirect response to the login endpoint when not authenticated but previously authorized.', async () => {
      cookies['guarani:consent'] = 'consent_id';

      const client = <Client>{ id: 'client_id' };
      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
      };

      consentServiceMock.findOne.mockResolvedValueOnce(consent);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/login?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': null },
        statusCode: 303,
      });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return the entities of the interaction.', async () => {
      cookies['guarani:grant'] = 'grant_id';
      cookies['guarani:consent'] = 'consent_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toEqual<Entities>([
        grant,
        grant.session!,
        consent,
      ]);
    });
    // #endregion

    // #region Authenticated and Authorized.
    it('should return a redirect response to the login endpoint if the session is expired.', async () => {
      cookies['guarani:session'] = 'session_id';
      cookies['guarani:consent'] = 'consent_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id', expiresAt: new Date(Date.now() - 3600000) };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/login?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': null },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the login endpoint if the session\'s creation date is longer than "max_age".', async () => {
      Reflect.set(parameters, 'max_age', 300);

      cookies['guarani:session'] = 'session_id';
      cookies['guarani:consent'] = 'consent_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id', createdAt: new Date(Date.now() - 3600000) };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/login?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': null },
        statusCode: 303,
      });

      expect(sessionServiceMock.remove).not.toHaveBeenCalled();

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the consent endpoint if the consent is expired.', async () => {
      cookies['guarani:session'] = 'session_id';
      cookies['guarani:consent'] = 'consent_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id', expiresAt: new Date(Date.now() - 3600000) };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters,
        expiresAt: new Date(Date.now() + 300000),
        client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/consent?${redirectParameters.toString()}` },
        cookies: { 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null },
        statusCode: 303,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(consent);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith({ ...grant, session });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return the entities of the interaction.', async () => {
      cookies['guarani:session'] = 'session_id';
      cookies['guarani:consent'] = 'consent_id';

      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      await expect(handler.getEntitiesOrHttpResponse(parameters, cookies, client, [])).resolves.toEqual<Entities>([
        null,
        session,
        consent,
      ]);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });
    // #endregion
  });
});
