import { DependencyInjectionContainer } from '@guarani/di';

import { ConsentContextInteractionContext } from '../context/interaction/consent-context.interaction-context';
import { ConsentDecisionInteractionContext } from '../context/interaction/consent-decision.interaction-context';
import { ConsentDecisionAcceptInteractionContext } from '../context/interaction/consent-decision-accept.interaction-context';
import { ConsentDecisionDenyInteractionContext } from '../context/interaction/consent-decision-deny.interaction-context';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AccountSelectionRequiredException } from '../exceptions/account-selection-required.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { Logger } from '../logger/logger';
import { ConsentDecisionInteractionRequest } from '../requests/interaction/consent-decision.interaction-request';
import { ConsentDecisionAcceptInteractionRequest } from '../requests/interaction/consent-decision-accept.interaction-request';
import { ConsentDecisionDenyInteractionRequest } from '../requests/interaction/consent-decision-deny.interaction-request';
import { ResponseType } from '../response-types/response-type.type';
import { ConsentContextInteractionResponse } from '../responses/interaction/consent-context.interaction-response';
import { ConsentDecisionInteractionResponse } from '../responses/interaction/consent-decision.interaction-response';
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
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { ConsentInteractionType } from './consent.interaction-type';
import { ConsentDecision } from './consent-decision.type';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

jest.mock('../logger/logger');

const codeLessResponseTypes: ResponseType[] = ['id_token token', 'id_token', 'token'];

describe('Consent Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: ConsentInteractionType;

  const loggerMock = jest.mocked(Logger.prototype);

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const loginServiceMock = jest.mocked<LoginServiceInterface>({
    create: jest.fn(),
    findByUserId: jest.fn(),
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
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<LoginServiceInterface>(LOGIN_SERVICE).toValue(loginServiceMock);
    container.bind<ConsentServiceInterface>(CONSENT_SERVICE).toValue(consentServiceMock);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind(ConsentInteractionType).toSelf().asSingleton();

    interactionType = container.resolve(ConsentInteractionType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "consent" as its name.', () => {
      expect(interactionType.name).toEqual<InteractionType>('consent');
    });
  });

  describe('handleContext()', () => {
    let context: ConsentContextInteractionContext;
    let client: Client;
    let user: User;
    let login: Login;
    let session: Session;
    let consent: Consent;
    let grant: Grant;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
      });

      user = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id', user });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      });

      consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), { id: 'consent_id' });

      grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
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
        consent,
      });

      context = <ConsentContextInteractionContext>{
        parameters: {
          interaction_type: 'consent',
          consent_challenge: 'consent_challenge',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'consent',
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

    it('should throw when no active login is found at the session and the prompt includes "select_account".', async () => {
      session.activeLogin = null;

      Reflect.set(grant.parameters, 'prompt', 'select_account');

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccountSelectionRequiredException,
        'Account selection required.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should throw when no active login is found at the session.', async () => {
      session.activeLogin = null;

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        LoginRequiredException,
        'No active Login found.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should return a valid first time consent context response.', async () => {
      grant.consent = null;

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<ConsentContextInteractionResponse>({
        skip: false,
        requested_scope: 'foo bar baz',
        subject: 'user_id',
        request_url: requestUrl.href,
        login_challenge: 'login_challenge',
        client: 'client_id',
        context: {
          display: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });
    });

    it('should return a valid skip consent context response.', async () => {
      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<ConsentContextInteractionResponse>({
        skip: true,
        requested_scope: 'foo bar baz',
        subject: 'user_id',
        request_url: requestUrl.href,
        login_challenge: 'login_challenge',
        client: 'client_id',
        context: {
          display: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });
    });
  });

  describe('handleDecision()', () => {
    let context: ConsentDecisionInteractionContext;
    let client: Client;
    let user: User;
    let login: Login;
    let session: Session;
    let grant: Grant;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      user = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id', user, clients: [] });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      });

      grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
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
        client,
        session,
        consent: null,
      });

      context = <ConsentDecisionInteractionContext>{
        parameters: {
          interaction_type: 'consent',
          consent_challenge: 'consent_challenge',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'consent',
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

    it('should throw when no active login is found at the session and the prompt includes "select_account".', async () => {
      session.activeLogin = null;

      Reflect.set(grant.parameters, 'prompt', 'select_account');

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccountSelectionRequiredException,
        'Account selection required.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should throw when no active login is found at the session.', async () => {
      session.activeLogin = null;

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        LoginRequiredException,
        'No active Login found.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    // #region Accept Decision.
    it('should return a valid first time consent accept decision interaction response.', async () => {
      Object.assign<
        ConsentDecisionInteractionRequest<ConsentDecision>,
        Partial<ConsentDecisionAcceptInteractionRequest>
      >(context.parameters, { decision: 'accept', grant_scope: 'foo bar' });

      Object.assign<
        ConsentDecisionInteractionContext<ConsentDecision>,
        Partial<ConsentDecisionAcceptInteractionContext>
      >(context, { decision: 'accept', grantedScopes: ['foo', 'bar'] });

      const { grantedScopes } = context as ConsentDecisionAcceptInteractionContext;

      const consent: Consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
        id: 'consent_id',
        scopes: grantedScopes,
      });

      consentServiceMock.create.mockResolvedValueOnce(consent);

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(consentServiceMock.create).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.create).toHaveBeenCalledWith(['foo', 'bar'], client, user);

      expect(loginServiceMock.save).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.save).toHaveBeenCalledWith(<Login>{ ...login, clients: [client] });

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(session);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...grant, interactions: ['consent'], consent });
    });

    it('should return a valid first time consent accept decision interaction response with an "offline_access" scope.', async () => {
      Object.assign<
        ConsentDecisionInteractionRequest<ConsentDecision>,
        Partial<ConsentDecisionAcceptInteractionRequest>
      >(context.parameters, { decision: 'accept', grant_scope: 'foo bar offline_access' });

      Object.assign<
        ConsentDecisionInteractionContext<ConsentDecision>,
        Partial<ConsentDecisionAcceptInteractionContext>
      >(context, { decision: 'accept', grantedScopes: ['foo', 'bar', 'offline_access'] });

      const { grantedScopes } = context as ConsentDecisionAcceptInteractionContext;

      const consent: Consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
        id: 'consent_id',
        scopes: grantedScopes,
      });

      consentServiceMock.create.mockResolvedValueOnce(consent);

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(loginServiceMock.save).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.save).toHaveBeenCalledWith(<Login>{ ...login, clients: [client] });

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(session);

      expect(consentServiceMock.create).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.create).toHaveBeenCalledWith(['foo', 'bar', 'offline_access'], client, user);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...grant, interactions: ['consent'], consent });
    });

    it.each(codeLessResponseTypes)(
      'should return a valid first time consent accept decision interaction response without an "offline_access" scope.',
      async (responseType) => {
        Reflect.set(grant.parameters, 'response_type', responseType);

        Object.assign<
          ConsentDecisionInteractionRequest<ConsentDecision>,
          Partial<ConsentDecisionAcceptInteractionRequest>
        >(context.parameters, { decision: 'accept', grant_scope: 'foo bar offline_access' });

        Object.assign<
          ConsentDecisionInteractionContext<ConsentDecision>,
          Partial<ConsentDecisionAcceptInteractionContext>
        >(context, { decision: 'accept', grantedScopes: ['foo', 'bar', 'offline_access'] });

        const { grantedScopes } = context as ConsentDecisionAcceptInteractionContext;

        const consent: Consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
          id: 'consent_id',
          scopes: grantedScopes,
        });

        consentServiceMock.create.mockResolvedValueOnce(consent);

        const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

        await expect(
          interactionType.handleDecision(context),
        ).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({ redirect_to: redirectTo.href });

        expect(loginServiceMock.save).toHaveBeenCalledTimes(1);
        expect(loginServiceMock.save).toHaveBeenCalledWith(<Login>{ ...login, clients: [client] });

        expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
        expect(sessionServiceMock.save).toHaveBeenCalledWith(session);

        expect(consentServiceMock.create).toHaveBeenCalledTimes(1);
        expect(consentServiceMock.create).toHaveBeenCalledWith(['foo', 'bar'], client, user);

        expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
        expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...grant, interactions: ['consent'], consent });
      },
    );

    it('should return a valid subsequent consent accept decision interaction response.', async () => {
      Object.assign<
        ConsentDecisionInteractionRequest<ConsentDecision>,
        Partial<ConsentDecisionAcceptInteractionRequest>
      >(context.parameters, { decision: 'accept', grant_scope: 'foo bar' });

      Object.assign<
        ConsentDecisionInteractionContext<ConsentDecision>,
        Partial<ConsentDecisionAcceptInteractionContext>
      >(context, { decision: 'accept', grantedScopes: ['foo', 'bar'] });

      const { grantedScopes } = context as ConsentDecisionAcceptInteractionContext;

      grant.consent = Object.assign<Consent, Partial<Consent>>(Reflect.construct(Consent, []), {
        id: 'consent_id',
        scopes: grantedScopes,
      });

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(loginServiceMock.save).not.toHaveBeenCalled();
      expect(sessionServiceMock.save).not.toHaveBeenCalled();
      expect(consentServiceMock.create).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Deny Decision.
    it('should return a valid login deny decision interaction response.', async () => {
      Object.assign<ConsentDecisionInteractionContext<ConsentDecision>, Partial<ConsentDecisionDenyInteractionContext>>(
        context,
        {
          parameters: Object.assign<
            ConsentDecisionInteractionRequest<ConsentDecision>,
            Partial<ConsentDecisionDenyInteractionRequest>
          >(context.parameters, {
            decision: 'deny',
            error: 'consent_denied',
            error_description: 'Lorem ipsum dolor sit amet...',
          }),
          decision: 'deny',
          error: Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
            Reflect.construct(OAuth2Exception, [context.parameters.error_description as string]),
            { error: context.parameters.error as string },
          ),
        },
      );

      const { error } = context as ConsentDecisionDenyInteractionContext;

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });
    // #endregion
  });
});
