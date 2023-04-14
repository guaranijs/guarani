import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { ConsentPrompt } from './consent.prompt';
import { Prompt } from './prompt.type';

type Entities = [Grant | null, Session | null, Consent | null];

describe('Consent Prompt', () => {
  let container: DependencyInjectionContainer;
  let prompt: ConsentPrompt;

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
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

    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<ConsentServiceInterface>(CONSENT_SERVICE).toValue(consentServiceMock);
    container.bind(ConsentPrompt).toSelf().asSingleton();

    prompt = container.resolve(ConsentPrompt);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "consent" as its value.', () => {
      expect(prompt.name).toEqual<Prompt>('consent');
    });
  });

  describe('handle()', () => {
    let parameters: AuthorizationRequest;

    beforeEach(() => {
      parameters = {
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://example.com/callback',
        scope: 'foo bar',
        state: 'client_state',
        prompt: 'consent',
      };
    });

    it('should throw when not authenticated prior to the authorization request.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = null;
      const session = null;
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new LoginRequiredException({ state: 'client_state' })
      );

      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it('should not throw when not authenticated prior to the authorization request if the prompt is "login consent".', async () => {
      Reflect.set(parameters, 'prompt', 'login consent');

      const client = <Client>{ id: 'client_id' };
      const grant = null;
      const session = null;
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).resolves.toEqual<Entities>([
        grant,
        session,
        consent,
      ]);
    });

    it('should return a null grant and consent when starting an authorization process.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = null;
      const session = <Session>{ id: 'session_id' };
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).resolves.toEqual<Entities>([
        null,
        session,
        null,
      ]);
    });

    it('should return a grant without a consent entity when accessing the consent endpoint but not authorizing.', async () => {
      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{ id: 'grant_id', session };
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).resolves.toEqual<Entities>([
        grant,
        session,
        null,
      ]);
    });

    it('should return a grant and a consent when authorizing at the consent endpoint.', async () => {
      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{ id: 'grant_id', session, consent: { id: 'consent_id' } };
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).resolves.toEqual<Entities>([
        grant,
        session,
        null,
      ]);
    });

    it('should discard a previous consent.', async () => {
      const client = <Client>{ id: 'client_id' };
      const session = <Session>{ id: 'session_id' };
      const grant = <Grant>{ id: 'grant_id', session };
      const consent = <Consent>{ id: 'consent_id' };

      await expect(prompt.handle(parameters, client, grant, session, consent)).resolves.toEqual<Entities>([
        grant,
        session,
        null,
      ]);

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(consent);
    });
  });
});
