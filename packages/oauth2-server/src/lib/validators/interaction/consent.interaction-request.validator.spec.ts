import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';

import { ConsentContextInteractionContext } from '../../context/interaction/consent-context.interaction-context';
import { ConsentDecisionAcceptInteractionContext } from '../../context/interaction/consent-decision-accept.interaction-context';
import { ConsentDecisionDenyInteractionContext } from '../../context/interaction/consent-decision-deny.interaction-context';
import { Grant } from '../../entities/grant.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { ConsentContextInteractionRequest } from '../../requests/interaction/consent-context.interaction-request';
import { ConsentDecisionAcceptInteractionRequest } from '../../requests/interaction/consent-decision-accept.interaction-request';
import { ConsentDecisionDenyInteractionRequest } from '../../requests/interaction/consent-decision-deny.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { ConsentInteractionRequestValidator } from './consent.interaction-request.validator';
import { InvalidScopeException } from '../../exceptions/invalid-scope.exception';

jest.mock('../../handlers/scope.handler');

const invalidConsentChallenges: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('a'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

const invalidDecisions: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('a'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

const invalidGrantedScopes: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('a'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

const invalidErrors: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];

const invalidErrorDescriptions: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('a'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

describe('Consent Interaction Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: ConsentInteractionRequestValidator;

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const interactionTypesMocks = [
    jest.mocked<InteractionTypeInterface>({ name: 'consent', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'login', handleContext: jest.fn(), handleDecision: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);

    interactionTypesMocks.forEach((interactionTypeMock) => {
      container.bind<InteractionTypeInterface>(INTERACTION_TYPE).toValue(interactionTypeMock);
    });

    container.bind(ConsentInteractionRequestValidator).toSelf().asSingleton();

    validator = container.resolve(ConsentInteractionRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "consent" as its name.', () => {
      expect(validator.name).toEqual<InteractionType>('consent');
    });
  });

  describe('validateContext()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/interaction',
        query: { interaction_type: 'consent', consent_challenge: 'consent_challenge' },
      });
    });

    it.each(invalidConsentChallenges)(
      'should throw when providing an invalid "consent_challenge" parameter.',
      async (consentChallenge) => {
        request.query.consent_challenge = consentChallenge;

        await expect(validator.validateContext(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "consent_challenge".' })
        );
      }
    );

    it('should throw when no grant is found.', async () => {
      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Consent Challenge.' })
      );
    });

    it('should return a consent context interaction context.', async () => {
      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<ConsentContextInteractionContext>({
        parameters: request.query as ConsentContextInteractionRequest,
        interactionType: interactionTypesMocks[0]!,
        grant,
      });
    });
  });

  describe('validateDecision()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: { interaction_type: 'consent', consent_challenge: 'consent_challenge', decision: '' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/interaction',
        query: {},
      });
    });

    it.each(invalidConsentChallenges)(
      'should throw when providing an invalid "consent_challenge" parameter.',
      async (consentChallenge) => {
        request.body.consent_challenge = consentChallenge;

        await expect(validator.validateDecision(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "consent_challenge".' })
        );
      }
    );

    it('should throw when no grant is found.', async () => {
      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Consent Challenge.' })
      );
    });

    it.each(invalidDecisions)('should throw when providing an invalid "decision" parameter.', async (decision) => {
      request.body.decision = decision;

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "decision".' })
      );
    });

    it('should throw when providing an unsupported decision.', async () => {
      request.body.decision = 'unknown';

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported decision "unknown".' })
      );
    });

    // #region Accept Decision
    it.each(invalidGrantedScopes)(
      'should throw when providing an invalid "grant_scope" parameter.',
      async (grantedScope) => {
        Object.assign(request.body, { decision: 'accept', grant_scope: grantedScope });

        const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

        grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

        await expect(validator.validateDecision(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "grant_scope".' })
        );
      }
    );

    it('should throw when requesting an unsupported scope.', async () => {
      Object.assign(request.body, { decision: 'accept', grant_scope: 'foo bar unknown' });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      const error = new InvalidScopeException({ description: 'Unsupported scope "unknown".' });

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(validator.validateDecision(request)).rejects.toThrow(error);
    });

    it('should throw when granting a scope that was not previously requested.', async () => {
      Object.assign(request.body, { decision: 'accept', grant_scope: 'foo bar baz' });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge', parameters: { scope: 'foo bar' } };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'The scope "baz" was not requested by the Client.' })
      );
    });

    it('should return a consent decision accept interaction context.', async () => {
      Object.assign(request.body, { decision: 'accept', grant_scope: 'foo bar' });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge', parameters: { scope: 'foo bar' } };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<ConsentDecisionAcceptInteractionContext>(
        {
          parameters: request.body as ConsentDecisionAcceptInteractionRequest,
          interactionType: interactionTypesMocks[0]!,
          grant,
          decision: 'accept',
          grantedScopes: ['foo', 'bar'],
        }
      );
    });
    // #endregion

    // #region Deny Decision
    it.each(invalidErrors)('should throw when providing an invalid "error" parameter.', async (error) => {
      Object.assign(request.body, { decision: 'deny', error });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "error".' })
      );
    });

    it.each(invalidErrorDescriptions)(
      'should throw when providing an invalid "error_description" parameter.',
      async (errorDescription) => {
        Object.assign(request.body, { decision: 'deny', error: 'consent_denied', error_description: errorDescription });

        const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

        grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

        await expect(validator.validateDecision(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "error_description".' })
        );
      }
    );

    it('should return a consent decision deny interaction context.', async () => {
      Object.assign(request.body, {
        decision: 'deny',
        error: 'consent_denied',
        error_description: 'Lorem ipsum dolor sit amet...',
      });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      const error: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, [{ description: request.body.error_description }]),
        { code: request.body.error as string }
      );

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<ConsentDecisionDenyInteractionContext>({
        parameters: request.body as ConsentDecisionDenyInteractionRequest,
        interactionType: interactionTypesMocks[0]!,
        grant,
        decision: 'deny',
        error,
      });
    });
    // #endregion
  });
});
