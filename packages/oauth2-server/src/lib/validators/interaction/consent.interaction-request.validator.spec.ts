import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { ConsentContextInteractionContext } from '../../context/interaction/consent-context.interaction-context';
import { ConsentDecisionAcceptInteractionContext } from '../../context/interaction/consent-decision-accept.interaction-context';
import { ConsentDecisionDenyInteractionContext } from '../../context/interaction/consent-decision-deny.interaction-context';
import { Grant } from '../../entities/grant.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../../exceptions/invalid-scope.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { ConsentDecision } from '../../interaction-types/consent-decision.type';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { Logger } from '../../logger/logger';
import { ConsentContextInteractionRequest } from '../../requests/interaction/consent-context.interaction-request';
import { ConsentDecisionInteractionRequest } from '../../requests/interaction/consent-decision.interaction-request';
import { ConsentDecisionAcceptInteractionRequest } from '../../requests/interaction/consent-decision-accept.interaction-request';
import { ConsentDecisionDenyInteractionRequest } from '../../requests/interaction/consent-decision-deny.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { ConsentInteractionRequestValidator } from './consent.interaction-request.validator';

jest.mock('../../handlers/scope.handler');
jest.mock('../../logger/logger');

describe('Consent Interaction Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: ConsentInteractionRequestValidator;

  const loggerMock = jest.mocked(Logger.prototype);

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

    container.bind(Logger).toValue(loggerMock);
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
    let parameters: ConsentContextInteractionRequest;

    const requestFactory = (data: Partial<ConsentContextInteractionRequest> = {}): HttpRequest => {
      removeNullishValues<ConsentContextInteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/interaction?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      parameters = { interaction_type: 'consent', consent_challenge: 'consent_challenge' };
    });

    it('should throw when not providing the parameter "consent_challenge".', async () => {
      const request = requestFactory({ consent_challenge: undefined });

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "consent_challenge".',
      );
    });

    it('should throw when no grant is found.', async () => {
      const request = requestFactory();

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Consent Challenge.',
      );
    });

    it('should return a consent context interaction context.', async () => {
      const request = requestFactory();

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<ConsentContextInteractionContext>({
        parameters,
        interactionType: interactionTypesMocks[0]!,
        grant,
      });
    });
  });

  describe('validateDecision()', () => {
    let parameters: ConsentDecisionInteractionRequest;

    const requestFactory = (data: Partial<ConsentDecisionInteractionRequest> = {}): HttpRequest => {
      removeNullishValues<ConsentDecisionInteractionRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/interaction'),
      });
    };

    beforeEach(() => {
      parameters = <ConsentDecisionInteractionRequest>{
        interaction_type: 'consent',
        consent_challenge: 'consent_challenge',
      };
    });

    it('should throw when not providing the parameter "consent_challenge".', async () => {
      const request = requestFactory({ consent_challenge: undefined });

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "consent_challenge".',
      );
    });

    it('should throw when no grant is found.', async () => {
      const request = requestFactory();

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Consent Challenge.',
      );
    });

    it('should throw when not providing the parameter "decision".', async () => {
      const request = requestFactory({ decision: undefined });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "decision".',
      );
    });

    it('should throw when providing an unsupported decision.', async () => {
      const request = requestFactory({ decision: 'unknown' as ConsentDecision });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported decision "unknown".',
      );
    });

    // #region Accept Decision
    it('should throw when not providing the parameter "grant_scope".', async () => {
      const request = requestFactory({ decision: 'accept', grant_scope: undefined });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "grant_scope".',
      );
    });

    it('should throw when requesting an unsupported scope.', async () => {
      const request = requestFactory({ decision: 'accept', grant_scope: 'foo bar unknown' });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      const error = new InvalidScopeException('Unsupported scope "unknown".');

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(validator.validateDecision(request)).rejects.toThrow(error);
    });

    it('should throw when granting a scope that was not previously requested.', async () => {
      const request = requestFactory({ decision: 'accept', grant_scope: 'foo bar baz' });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge', parameters: { scope: 'foo bar' } };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'The scope "baz" was not requested by the Client.',
      );
    });

    it('should return a consent decision accept interaction context.', async () => {
      const request = requestFactory({ decision: 'accept', grant_scope: 'foo bar' });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge', parameters: { scope: 'foo bar' } };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);
      scopeHandlerMock.checkRequestedScope.mockReturnValueOnce();

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<ConsentDecisionAcceptInteractionContext>(
        {
          parameters: parameters as ConsentDecisionAcceptInteractionRequest,
          interactionType: interactionTypesMocks[0]!,
          grant,
          decision: 'accept',
          grantedScopes: ['foo', 'bar'],
        },
      );
    });
    // #endregion

    // #region Deny Decision
    it('should throw when not providing the parameter "error".', async () => {
      const request = requestFactory({ decision: 'deny', error: undefined });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "error".',
      );
    });

    it('should throw when not providing the parameter "error_description".', async () => {
      const request = requestFactory({ decision: 'deny', error: 'consent_denied', error_description: undefined });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "error_description".',
      );
    });

    it('should return a consent decision deny interaction context.', async () => {
      const request = requestFactory({
        decision: 'deny',
        error: 'consent_denied',
        error_description: 'Lorem ipsum dolor sit amet...',
      });

      const grant = <Grant>{ id: 'grant_id', consentChallenge: 'consent_challenge' };

      const error: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, [parameters.error_description as string]),
        { error: parameters.error as string },
      );

      grantServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(grant);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<ConsentDecisionDenyInteractionContext>({
        parameters: parameters as ConsentDecisionDenyInteractionRequest,
        interactionType: interactionTypesMocks[0]!,
        grant,
        decision: 'deny',
        error,
      });
    });
    // #endregion
  });
});
