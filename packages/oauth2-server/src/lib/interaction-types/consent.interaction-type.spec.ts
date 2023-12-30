import { DependencyInjectionContainer } from '@guarani/di';

import { ConsentContextInteractionContext } from '../context/interaction/consent-context.interaction-context';
import { ConsentDecisionInteractionContext } from '../context/interaction/consent-decision.interaction-context';
import { ConsentDecisionAcceptInteractionContext } from '../context/interaction/consent-decision-accept.interaction-context';
import { ConsentDecisionDenyInteractionContext } from '../context/interaction/consent-decision-deny.interaction-context';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AccountSelectionRequiredException } from '../exceptions/account-selection-required.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
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
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

const codeLessResponseTypes: ResponseType[] = ['id_token token', 'id_token', 'token'];

describe('Consent Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: ConsentInteractionType;

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

    beforeEach(() => {
      const now = Date.now();

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
        grant: <Grant>{
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
          client: { id: 'client_id', subjectType: 'public' },
          session: {
            id: 'session_id',
            activeLogin: { id: 'login_id', user: { id: 'user_id' } },
            logins: [{ id: 'login_id', user: { id: 'user_id' } }],
          },
          consent: { id: 'consent_id' },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session and the prompt includes "select_account".', async () => {
      context.grant.session.activeLogin = null;

      Reflect.set(context.grant.parameters, 'prompt', 'select_account');

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccountSelectionRequiredException,
        'Account selection required.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session.', async () => {
      context.grant.session.activeLogin = null;

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        LoginRequiredException,
        'No active login found.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should return a valid first time consent context response.', async () => {
      context.grant.consent = null;

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

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
      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

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

    beforeEach(() => {
      const now = Date.now();

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
        grant: <Grant>{
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
          client: { id: 'client_id' },
          session: {
            id: 'session_id',
            activeLogin: { id: 'login_id', user: { id: 'user_id' }, clients: <Client[]>[] },
            logins: [{ id: 'login_id', user: { id: 'user_id' }, clients: <Client[]>[] }],
          },
          consent: { id: 'consent_id', scopes: ['foo', 'bar'] },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session and the prompt includes "select_account".', async () => {
      context.grant.session.activeLogin = null;

      Reflect.set(context.grant.parameters, 'prompt', 'select_account');

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccountSelectionRequiredException,
        'Account selection required.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session.', async () => {
      context.grant.session.activeLogin = null;

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        LoginRequiredException,
        'No active login found.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    // #region Accept Decision.
    it('should return a valid first time consent accept decision interaction response.', async () => {
      context.grant.consent = null;

      Object.assign(context.parameters, { decision: 'accept', grant_scope: 'foo bar' });
      Object.assign(context, { decision: 'accept', grantedScopes: ['foo', 'bar'] });

      const { grantedScopes } = context as ConsentDecisionAcceptInteractionContext;

      const consent = <Consent>{ id: 'consent_id', scopes: grantedScopes };

      consentServiceMock.create.mockResolvedValueOnce(consent);

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(consentServiceMock.create).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.create).toHaveBeenCalledWith(
        ['foo', 'bar'],
        context.grant.client,
        context.grant.session.activeLogin!.user,
      );

      expect(loginServiceMock.save).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.save).toHaveBeenCalledWith(<Login>{
        ...context.grant.session.activeLogin!,
        clients: [context.grant.client],
      });

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(context.grant.session);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{
        ...context.grant,
        interactions: ['consent'],
        consent,
      });
    });

    it('should return a valid first time consent accept decision interaction response with an "offline_access" scope.', async () => {
      context.grant.consent = null;

      Object.assign(context.parameters, { decision: 'accept', grant_scope: 'foo bar offline_access' });
      Object.assign(context, { decision: 'accept', grantedScopes: ['foo', 'bar', 'offline_access'] });

      const { grantedScopes } = context as ConsentDecisionAcceptInteractionContext;

      const consent = <Consent>{ id: 'consent_id', scopes: grantedScopes };

      consentServiceMock.create.mockResolvedValueOnce(consent);

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(loginServiceMock.save).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.save).toHaveBeenCalledWith(<Login>{
        ...context.grant.session.activeLogin!,
        clients: [context.grant.client],
      });

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(context.grant.session);

      expect(consentServiceMock.create).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.create).toHaveBeenCalledWith(
        ['foo', 'bar', 'offline_access'],
        context.grant.client,
        context.grant.session.activeLogin!.user,
      );

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{
        ...context.grant,
        interactions: ['consent'],
        consent,
      });
    });

    it.each(codeLessResponseTypes)(
      'should return a valid first time consent accept decision interaction response without an "offline_access" scope.',
      async (responseType) => {
        context.grant.consent = null;

        Reflect.set(context.grant.parameters, 'response_type', responseType);

        Object.assign(context.parameters, { decision: 'accept', grant_scope: 'foo bar offline_access' });
        Object.assign(context, { decision: 'accept', grantedScopes: ['foo', 'bar', 'offline_access'] });

        const { grantedScopes } = context as ConsentDecisionAcceptInteractionContext;

        const consent = <Consent>{ id: 'consent_id', scopes: grantedScopes };

        consentServiceMock.create.mockResolvedValueOnce(consent);

        const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

        await expect(
          interactionType.handleDecision(context),
        ).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
          redirect_to: redirectTo.href,
        });

        expect(loginServiceMock.save).toHaveBeenCalledTimes(1);
        expect(loginServiceMock.save).toHaveBeenCalledWith(<Login>{
          ...context.grant.session.activeLogin!,
          clients: [context.grant.client],
        });

        expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
        expect(sessionServiceMock.save).toHaveBeenCalledWith(context.grant.session);

        expect(consentServiceMock.create).toHaveBeenCalledTimes(1);
        expect(consentServiceMock.create).toHaveBeenCalledWith(
          ['foo', 'bar'],
          context.grant.client,
          context.grant.session.activeLogin!.user,
        );

        expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
        expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{
          ...context.grant,
          interactions: ['consent'],
          consent,
        });
      },
    );

    it('should return a valid subsequent consent accept decision interaction response.', async () => {
      Object.assign(context.parameters, { decision: 'accept', grant_scope: 'foo bar' });
      Object.assign(context, { decision: 'accept', grantedScopes: ['foo', 'bar'] });

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

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
      Object.assign(context, {
        parameters: Object.assign(context.parameters, {
          decision: 'deny',
          error: 'consent_denied',
          error_description: 'Lorem ipsum dolor sit amet...',
        }),
        decision: 'deny',
        error: Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
          Reflect.construct(OAuth2Exception, [context.parameters.error_description as string]),
          { error: context.parameters.error as string },
        ),
      });

      const { error } = context as ConsentDecisionDenyInteractionContext;

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });
    // #endregion
  });
});
