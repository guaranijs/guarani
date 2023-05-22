import { DependencyInjectionContainer } from '@guarani/di';

import { URLSearchParams } from 'url';

import { ConsentContextInteractionContext } from '../context/interaction/consent-context.interaction.context';
import { ConsentDecisionAcceptInteractionContext } from '../context/interaction/consent-decision-accept.interaction.context';
import { ConsentDecisionDenyInteractionContext } from '../context/interaction/consent-decision-deny.interaction.context';
import { ConsentDecisionInteractionContext } from '../context/interaction/consent-decision.interaction.context';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AccountSelectionRequiredException } from '../exceptions/account-selection-required.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ConsentContextInteractionResponse } from '../responses/interaction/consent-context.interaction-response';
import { ConsentDecisionInteractionResponse } from '../responses/interaction/consent-decision.interaction-response';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ConsentDecision } from './consent-decision.type';
import { ConsentInteractionType } from './consent.interaction-type';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

describe('Consent Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: ConsentInteractionType;

  const settings = <Settings>{ issuer: 'https://server.example.com' };

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
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'consent',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        }),
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

      await expect(interactionType.handleContext(context)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Grant.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session and the prompt includes "select_account".', async () => {
      delete context.grant.session.activeLogin;
      Reflect.set(context.grant.parameters, 'prompt', 'select_account');

      await expect(interactionType.handleContext(context)).rejects.toThrow(
        new AccountSelectionRequiredException({ description: 'Account selection required.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session.', async () => {
      Reflect.deleteProperty(context.grant.session, 'activeLogin');

      await expect(interactionType.handleContext(context)).rejects.toThrow(
        new LoginRequiredException({ description: 'No active login found.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should return a valid first time consent context response.', async () => {
      delete context.grant.consent;

      const urlParameters = new URLSearchParams(context.grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<ConsentContextInteractionResponse>({
        skip: false,
        requested_scope: 'foo bar baz',
        subject: 'user_id',
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        login_challenge: 'login_challenge',
        client: 'client_id',
        context: {},
      });
    });

    it('should return a valid skip consent context response.', async () => {
      const urlParameters = new URLSearchParams(context.grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<ConsentContextInteractionResponse>({
        skip: true,
        requested_scope: 'foo bar baz',
        subject: 'user_id',
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        login_challenge: 'login_challenge',
        client: 'client_id',
        context: {},
      });
    });
  });

  describe('handleDecision()', () => {
    let context: ConsentDecisionInteractionContext<ConsentDecision>;

    beforeEach(() => {
      const now = Date.now();

      context = <ConsentDecisionInteractionContext<ConsentDecision>>{
        parameters: {
          interaction_type: 'consent',
          consent_challenge: 'consent_challenge',
          decision: <ConsentDecision>'',
        },
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'consent',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        }),
        decision: <ConsentDecision>'',
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
            activeLogin: { id: 'login_id', user: { id: 'user_id' } },
            logins: [{ id: 'login_id', user: { id: 'user_id' } }],
          },
          consent: { id: 'consent_id', scopes: ['foo', 'bar'] },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Grant.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session and the prompt includes "select_account".', async () => {
      delete context.grant.session.activeLogin;
      Reflect.set(context.grant.parameters, 'prompt', 'select_account');

      await expect(interactionType.handleDecision(context)).rejects.toThrow(
        new AccountSelectionRequiredException({ description: 'Account selection required.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should throw when no active login is found at the session.', async () => {
      Reflect.deleteProperty(context.grant.session, 'activeLogin');

      await expect(interactionType.handleDecision(context)).rejects.toThrow(
        new LoginRequiredException({ description: 'No active login found.' })
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    // #region Accept Decision.
    it('should return a valid first time consent accept decision interaction response.', async () => {
      delete context.grant.consent;

      Object.assign(context.parameters, { decision: 'accept', grant_scope: 'foo bar' });
      Object.assign(context, { decision: 'accept', grantedScopes: ['foo', 'bar'] });

      const { grantedScopes } = <ConsentDecisionAcceptInteractionContext>context;

      const consent = <Consent>{ id: 'consent_id', scopes: grantedScopes };

      consentServiceMock.create.mockResolvedValueOnce(consent);

      const urlParameters = new URLSearchParams(context.grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
      });

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{
        ...context.grant,
        interactions: ['consent'],
        consent,
      });
    });

    it('should return a valid subsequent consent accept decision interaction response.', async () => {
      Object.assign(context.parameters, { decision: 'accept', grant_scope: 'foo bar' });
      Object.assign(context, { decision: 'accept', grantedScopes: ['foo', 'bar'] });

      const urlParameters = new URLSearchParams(context.grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
      });

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
        error: Object.assign(
          Reflect.construct(OAuth2Exception, [{ description: context.parameters.error_description }]),
          { code: context.parameters.error }
        ),
      });

      const { error } = <ConsentDecisionDenyInteractionContext>context;

      const urlParameters = new URLSearchParams(error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/error?${urlParameters.toString()}`,
      });

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });
    // #endregion
  });
});
