import { DependencyInjectionContainer } from '@guarani/di';

import { URLSearchParams } from 'url';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { DisplayInterface } from '../displays/display.interface';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpResponse } from '../http/http.response';
import { PromptInterface } from '../prompts/prompt.interface';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { IdTokenHandler } from './id-token.handler';
import { InteractionHandler } from './interaction.handler';

jest.mock('./id-token.handler');

type Entities = [Grant | null, Session, Consent];

describe('Interaction Handler', () => {
  let container: DependencyInjectionContainer;
  let handler: InteractionHandler;

  const promptsMocks = [
    jest.mocked<PromptInterface>({ name: 'none', handle: jest.fn() }),
    jest.mocked<PromptInterface>({ name: 'login', handle: jest.fn() }),
    jest.mocked<PromptInterface>({ name: 'consent', handle: jest.fn() }),
  ];

  const displaysMocks = [jest.mocked<DisplayInterface>({ name: 'page', createHttpResponse: jest.fn() })];

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
        parameters: { state: 'client_state' },
        cookies: {},
        client: { id: 'client_id' },
        prompts: <PromptInterface[]>[],
      };
    });

    it('should return an error response when authentication is required.', async () => {
      Object.assign(context, { parameters: { prompt: 'none' }, prompts: [promptsMocks[0]!] });

      const error = new LoginRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse().redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );
    });

    it('should return an error response when authorization is required.', async () => {
      Object.assign(context, { parameters: { prompt: 'none' }, prompts: [promptsMocks[0]!] });

      const error = new ConsentRequiredException({ state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse().redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );
    });

    it('should return an error response for a generic error with a previous authorization.', async () => {
      Object.assign(context, { parameters: { prompt: 'none' }, prompts: [promptsMocks[0]!] });

      const error = new ServerErrorException({ description: 'An unexpected error occurred.', state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': null, 'guarani:session': null })
          .redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );
    });

    it('should return an error response for a generic error.', async () => {
      Object.assign(context, { parameters: { prompt: 'none' }, prompts: [promptsMocks[0]!] });

      const error = new ServerErrorException({ description: 'An unexpected error occurred.', state: 'client_state' });
      const errorParameters = new URLSearchParams(error.toJSON());

      consentServiceMock.findOne.mockResolvedValueOnce(<Consent>{ id: 'consent_id' });

      promptsMocks.find((prompt) => prompt.name === 'none')!.handle.mockRejectedValueOnce(error);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': null, 'guarani:session': null, 'guarani:consent': null })
          .redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );
    });

    // #region Not authenticated and not authorized.
    it('should return a redirect response to the login endpoint when starting a fresh authorization process.', async () => {
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        client: context.client,
      };

      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': null })
          .redirect(`https://server.example.com/auth/login?${redirectParameters.toString()}`)
      );

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the login endpoint when not authenticating at the login endpoint.', async () => {
      Reflect.set(context.cookies, 'guarani:grant', 'grant_id');

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        client: context.client,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': null })
          .redirect(`https://server.example.com/auth/login?${redirectParameters.toString()}`)
      );

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });

    it('should return an error response if the client of the request does not match the client of the grant.', async () => {
      Reflect.set(context.cookies, 'guarani:grant', 'grant_id');

      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        client: { id: 'another_client_id' },
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      const error = new InvalidRequestException({
        description: 'Mismatching Client Identifier.',
        state: 'client_state',
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': null, 'guarani:session': null })
          .redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return an error response if the grant is expired.', async () => {
      Reflect.set(context.cookies, 'guarani:grant', 'grant_id');

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

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': null, 'guarani:session': null })
          .redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return an error response if one or more parameters changed during the interactions.', async () => {
      Reflect.set(context.cookies, 'guarani:grant', 'grant_id');

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

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': null, 'guarani:session': null })
          .redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it("should return a redirect response to the login endpoint if the user authenticated but did not authorize before the session's expiration time.", async () => {
      Reflect.set(context.cookies, 'guarani:grant', 'grant_id');

      const session = <Session>{ id: 'session_id', expiresAt: new Date(Date.now() - 300000) };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        client: context.client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': null })
          .redirect(`https://server.example.com/auth/login?${redirectParameters.toString()}`)
      );

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);
    });

    it('should return an error response when the authenticated user does not match the user expected by the "id_token_hint".', async () => {
      Object.assign(context, {
        parameters: { id_token_hint: 'another_user_id_token' },
        cookies: { 'guarani:grant': 'grant_id' },
        idTokenHint: 'another_user_id_token',
      });

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        client: context.client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(false);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const error = new LoginRequiredException({
        description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
        state: 'client_state',
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': null, 'guarani:session': null })
          .redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return a redirect response to the consent endpoint if not previously authorized.', async () => {
      Reflect.set(context.cookies, 'guarani:grant', 'grant_id');

      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(false);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': grant.session!.id, 'guarani:consent': null })
          .redirect(`https://server.example.com/auth/consent?${redirectParameters.toString()}`)
      );

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });

    it('should return a redirect response to the consent enddpoint if the consent is expired.', async () => {
      Object.assign(context.cookies, { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' });

      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id', expiresAt: new Date(Date.now() - 300000) };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null })
          .redirect(`https://server.example.com/auth/consent?${redirectParameters.toString()}`)
      );

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(grant.consent!);
    });

    it('should return the entities of the interaction.', async () => {
      Object.assign(context.cookies, { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' });

      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toEqual<Entities>([
        grant,
        session,
        grant.consent!,
      ]);
    });
    // #endregion

    // #region Authenticated but not authorized.
    it('should return a redirect response to the consent endpoint when previously authenticated but not authorized.', async () => {
      Reflect.set(context.cookies, 'guarani:session', 'session_id');

      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null })
          .redirect(`https://server.example.com/auth/consent?${redirectParameters.toString()}`)
      );

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith({ ...grant, session });
    });

    it('should return a redirect response to the consent endpoint when previously authenticated but did not decide at the consent endpoint.', async () => {
      Object.assign(context.cookies, { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' });

      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null })
          .redirect(`https://server.example.com/auth/consent?${redirectParameters.toString()}`)
      );

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });

    it('should return a redirect response to the consent endpoint when previously authenticated but did not authorize and the consent expired.', async () => {
      Object.assign(context.cookies, { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' });

      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id', expiresAt: new Date(Date.now() - 300000) };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null })
          .redirect(`https://server.example.com/auth/consent?${redirectParameters.toString()}`)
      );

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(grant.consent!);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });

    it('should return the entities of the interaction.', async () => {
      Object.assign(context.cookies, { 'guarani:grant': 'grant_id', 'guarani:session': 'session_id' });

      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        consentChallenge: 'consent_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
        session,
        consent,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toEqual<Entities>([
        grant,
        session,
        grant.consent!,
      ]);
    });
    // #endregion

    // #region Not authenticated but authorized.
    it('should return a redirect response to the login endpoint when not authenticated but previously authorized.', async () => {
      Reflect.set(context.cookies, 'guarani:consent', 'consent_id');

      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      consentServiceMock.findOne.mockResolvedValueOnce(consent);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': null })
          .redirect(`https://server.example.com/auth/login?${redirectParameters.toString()}`)
      );

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return the entities of the interaction.', async () => {
      Object.assign(context.cookies, { 'guarani:grant': 'grant_id', 'guarani:consent': 'consent_id' });

      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
        session,
      };

      grantServiceMock.findOne.mockResolvedValueOnce(grant);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toEqual<Entities>([
        grant,
        grant.session!,
        consent,
      ]);
    });
    // #endregion

    // #region Authenticated and Authorized.
    it('should return a redirect response to the login endpoint if the session is expired.', async () => {
      Object.assign(context.cookies, { 'guarani:session': 'session_id', 'guarani:consent': 'consent_id' });

      const session = <Session>{ id: 'session_id', expiresAt: new Date(Date.now() - 3600000) };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': null })
          .redirect(`https://server.example.com/auth/login?${redirectParameters.toString()}`)
      );

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return an error response when the authenticated user does not match the user expected by the "id_token_hint".', async () => {
      Object.assign(context, {
        parameters: { id_token_hint: 'another_user_id_token' },
        cookies: { 'guarani:session': 'session_id', 'guarani:consent': 'consent_id' },
        idTokenHint: 'another_user_id_token',
      });

      const session = <Session>{ id: 'session_id', user: { id: 'user_id' } };
      const consent = <Consent>{ id: 'consent_id' };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(false);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const error = new LoginRequiredException({
        description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
        state: 'client_state',
      });

      const errorParameters = new URLSearchParams(error.toJSON());

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': null, 'guarani:session': null })
          .redirect(`https://server.example.com/oauth/error?${errorParameters.toString()}`)
      );

      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it('should return a redirect response to the login endpoint if the session\'s creation date is longer than "max_age".', async () => {
      Object.assign(context, {
        parameters: { max_age: '300' },
        cookies: { 'guarani:session': 'session_id', 'guarani:consent': 'consent_id' },
        maxAge: 300,
      });

      const session = <Session>{ id: 'session_id', createdAt: new Date(Date.now() - 3600000) };
      const grant = <Grant>{
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: context.parameters,
        expiresAt: new Date(Date.now() + 300000),
        client: context.client,
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      grantServiceMock.create.mockResolvedValueOnce(grant);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': null })
          .redirect(`https://server.example.com/auth/login?${redirectParameters.toString()}`)
      );

      expect(sessionServiceMock.remove).not.toHaveBeenCalled();

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return a redirect response to the consent endpoint if the consent is expired.', async () => {
      Object.assign(context.cookies, { 'guarani:session': 'session_id', 'guarani:consent': 'consent_id' });

      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id', expiresAt: new Date(Date.now() - 3600000) };
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
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      displaysMocks[0]!.createHttpResponse.mockImplementationOnce((redirectUri, parameters) => {
        return new HttpResponse().redirect(`${redirectUri}?${new URLSearchParams(parameters).toString()}`);
      });

      const redirectParameters = new URLSearchParams({ consent_challenge: grant.consentChallenge });

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toStrictEqual(
        new HttpResponse()
          .setCookies({ 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null })
          .redirect(`https://server.example.com/auth/consent?${redirectParameters.toString()}`)
      );

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(consent);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith({ ...grant, session });

      expect(grantServiceMock.create).toHaveBeenCalledTimes(1);
    });

    it('should return the entities of the interaction.', async () => {
      Object.assign(context.cookies, { 'guarani:session': 'session_id', 'guarani:consent': 'consent_id' });

      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id' };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      consentServiceMock.findOne.mockResolvedValueOnce(consent);
      idTokenHandlerMock.checkIdTokenHint.mockResolvedValueOnce(true);

      await expect(handler.getEntitiesOrHttpResponse(context)).resolves.toEqual<Entities>([null, session, consent]);

      expect(grantServiceMock.create).not.toHaveBeenCalled();
    });
    // #endregion
  });
});
