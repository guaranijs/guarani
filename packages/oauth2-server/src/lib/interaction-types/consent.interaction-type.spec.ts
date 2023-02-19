import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { AuthorizationRequest } from '../messages/authorization-request';
import { ConsentContextInteractionRequest } from '../messages/consent-context.interaction-request';
import { ConsentContextInteractionResponse } from '../messages/consent-context.interaction-response';
import { ConsentDecisionInteractionRequest } from '../messages/consent-decision.interaction-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ConsentDecisionInteractionResponse } from './consent-decision.interaction-response';
import { ConsentDecision } from './consent-decision.type';
import { ConsentInteractionType } from './consent.interaction-type';
import { InteractionType } from './interaction-type.type';

describe('Consent Interaction Type', () => {
  let interactionType: ConsentInteractionType;

  const consentServiceMock = jest.mocked<ConsentServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ConsentServiceInterface>(CONSENT_SERVICE).toValue(consentServiceMock);
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
    let parameters: ConsentContextInteractionRequest;

    beforeEach(() => {
      parameters = { interaction_type: 'consent', consent_challenge: 'consent_challenge' };
    });

    it('should throw when the parameter "consent_challenge" is not provided.', async () => {
      Reflect.deleteProperty(parameters, 'consent_challenge');

      await expect(interactionType.handleContext(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "consent_challenge".' })
      );
    });

    it('should throw when no consent is found.', async () => {
      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(null);

      await expect(interactionType.handleContext(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Consent Challenge.' })
      );
    });

    it('should throw when the consent is expired.', async () => {
      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        expiresAt: new Date(Date.now() - 3600000),
      });

      await expect(interactionType.handleContext(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Consent.' })
      );
    });

    it('should return a valid first time consent context response.', async () => {
      const consentParameters = <AuthorizationRequest>{
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://client.example.com/callback',
        scope: 'foo bar baz',
        state: 'client_state',
        response_mode: 'query',
      };

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        scopes: <string[]>[],
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: consentParameters,
        client: { id: 'client_id' },
        user: { id: 'user_id' },
      });

      const urlParameters = new URLSearchParams(consentParameters);

      await expect(interactionType.handleContext(parameters)).resolves.toStrictEqual<ConsentContextInteractionResponse>(
        {
          skip: false,
          requested_scope: 'foo bar baz',
          subject: 'user_id',
          request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
          login_challenge: 'login_challenge',
          client: <Client>{ id: 'client_id' },
          context: {},
        }
      );
    });
  });

  describe('handleDecision()', () => {
    let parameters: ConsentDecisionInteractionRequest;

    beforeEach(() => {
      parameters = {
        interaction_type: 'consent',
        consent_challenge: 'consent_challenge',
        decision: <ConsentDecision>'',
      };
    });

    it('should throw when the parameter "consent_challenge" is not provided.', async () => {
      Reflect.deleteProperty(parameters, 'consent_challenge');

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "consent_challenge".' })
      );
    });

    it('should throw when the parameter "decision" is not provided.', async () => {
      Reflect.deleteProperty(parameters, 'decision');

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "decision".' })
      );
    });

    it('should throw when no consent is found.', async () => {
      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(null);

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Consent Challenge.' })
      );
    });

    it('should throw when the consent is expired.', async () => {
      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        expiresAt: new Date(Date.now() - 3600000),
      });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Consent.' })
      );
    });

    it('should throw when providing an invalid decision.', async () => {
      Reflect.set(parameters, 'decision', 'unknown');

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
      });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported decision "unknown".' })
      );
    });

    it('should throw when the parameter "grant_scope" is not provided.', async () => {
      Reflect.set(parameters, 'decision', 'accept');

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
      });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "grant_scope".' })
      );
    });

    it('should throw when granting a scope not requested by the client.', async () => {
      Reflect.set(parameters, 'decision', 'accept');
      Reflect.set(parameters, 'grant_scope', 'foo bar qux');

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: { scope: 'foo bar baz' },
      });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidScopeException({ description: 'The granted scope was not requested by the Client.' })
      );
    });

    it('should return a valid consent accept decision interaction response.', async () => {
      Reflect.set(parameters, 'decision', 'accept');
      Reflect.set(parameters, 'grant_scope', 'foo bar');

      const consentParameters = <AuthorizationRequest>{
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://client.example.com/callback',
        scope: 'foo bar baz',
        state: 'client_state',
        response_mode: 'query',
      };

      const consent = <Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
        parameters: consentParameters,
      };

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(consent);

      const urlParameters = new URLSearchParams(consentParameters);

      await expect(
        interactionType.handleDecision(parameters)
      ).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
      });

      expect(consent.scopes).toEqual<string[]>(['foo', 'bar']);
      expect(consentServiceMock.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when the parameter "error" is not provided.', async () => {
      Reflect.set(parameters, 'decision', 'deny');

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
      });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "error".' })
      );
    });

    it('should throw when the parameter "error_description" is not provided.', async () => {
      Reflect.set(parameters, 'decision', 'deny');
      Reflect.set(parameters, 'error', 'custom_error');

      Reflect.deleteProperty(parameters, 'error_description');

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
      });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "error_description".' })
      );
    });

    it('should return a valid login deny decision interaction response.', async () => {
      Reflect.set(parameters, 'decision', 'deny');
      Reflect.set(parameters, 'error', 'custom_error');
      Reflect.set(parameters, 'error_description', 'Custom error description.');

      consentServiceMock.findOneByConsentChallenge.mockResolvedValueOnce(<Consent>{
        id: 'consent_id',
        loginChallenge: 'login_challenge',
        consentChallenge: 'consent_challenge',
      });

      const urlParameters = new URLSearchParams({
        error: parameters.error,
        error_description: parameters.error_description,
      });

      await expect(
        interactionType.handleDecision(parameters)
      ).resolves.toStrictEqual<ConsentDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/error?${urlParameters.toString()}`,
      });

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
    });
  });
});
