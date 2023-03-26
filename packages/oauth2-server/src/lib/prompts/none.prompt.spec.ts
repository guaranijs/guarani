import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { AuthorizationRequest } from '../messages/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { NonePrompt } from './none.prompt';
import { Prompt } from './prompt.type';

type Entities = [Grant | null, Session | null, Consent | null];

const session = <Session>{ id: 'session_id' };
const consent = <Consent>{ id: 'consent_id' };
const grantWithSession = <Grant>{ id: 'grant_id', session };
const grantWithConsent = <Grant>{ id: 'grant_id', consent };
const grantWithSessionAndConsent = <Grant>{ id: 'grant_id', session, consent };

const entitiesAndExpectedEntities: [Entities, Entities][] = [
  [
    [null, session, consent],
    [null, session, consent],
  ],
  [
    [grantWithSession, null, consent],
    [grantWithSession, session, consent],
  ],
  [
    [grantWithConsent, session, null],
    [grantWithConsent, session, consent],
  ],
  [
    [grantWithSessionAndConsent, null, null],
    [grantWithSessionAndConsent, session, consent],
  ],
  [
    [grantWithSessionAndConsent, null, consent],
    [grantWithSessionAndConsent, session, consent],
  ],
  [
    [grantWithSessionAndConsent, session, null],
    [grantWithSessionAndConsent, session, consent],
  ],
  [
    [grantWithSessionAndConsent, session, consent],
    [grantWithSessionAndConsent, session, consent],
  ],
];

describe('None Prompt', () => {
  let prompt: NonePrompt;

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

    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<ConsentServiceInterface>(CONSENT_SERVICE).toValue(consentServiceMock);
    container.bind(NonePrompt).toSelf().asSingleton();

    prompt = container.resolve(NonePrompt);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "none" as its value.', () => {
      expect(prompt.name).toEqual<Prompt>('none');
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
        prompt: 'none',
      };
    });

    it('should throw when the session and grant are null.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = null;
      const session = null;
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new LoginRequiredException({ state: 'client_state' })
      );
    });

    it('should throw when the session is null and the grant has no session.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{ id: 'grant_id' };
      const session = null;
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new LoginRequiredException({ state: 'client_state' })
      );
    });

    it("should throw when the session is null and the grant's session is expired.", async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{ id: 'grant_id', session: { id: 'session_id', expiresAt: new Date(Date.now() - 300000) } };
      const session = null;
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new LoginRequiredException({ state: 'client_state' })
      );

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(grant.session!);
    });

    it('should throw when the session is expired.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = null;
      const session = <Session>{ id: 'session_id', expiresAt: new Date(Date.now() - 300000) };
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new LoginRequiredException({ state: 'client_state' })
      );

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);
    });

    it('should throw when the consent and grant are null.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = null;
      const session = <Session>{ id: 'session_id' };
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new ConsentRequiredException({ state: 'client_state' })
      );
    });

    it('should throw when the consent is null and the grant has no consent.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{ id: 'grant_id' };
      const session = <Session>{ id: 'session_id' };
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new ConsentRequiredException({ state: 'client_state' })
      );
    });

    it("should throw when the consent is null and the grant's consent is expired.", async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = <Grant>{ id: 'grant_id', consent: { id: 'consent_id', expiresAt: new Date(Date.now() - 300000) } };
      const session = <Session>{ id: 'session_id' };
      const consent = null;

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new ConsentRequiredException({ state: 'client_state' })
      );

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(grant.consent!);
    });

    it('should throw when the consent is expired.', async () => {
      const client = <Client>{ id: 'client_id' };
      const grant = null;
      const session = <Session>{ id: 'session_id' };
      const consent = <Consent>{ id: 'consent_id', expiresAt: new Date(Date.now() - 300000) };

      await expect(prompt.handle(parameters, client, grant, session, consent)).rejects.toThrow(
        new ConsentRequiredException({ state: 'client_state' })
      );

      expect(consentServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(consentServiceMock.remove).toHaveBeenCalledWith(consent);
    });

    it.each(entitiesAndExpectedEntities)(
      'should return a 3-tuple with the grant, session and consent entities.',
      async ([grant, session, consent], expected) => {
        const client = <Client>{ id: 'client_id' };

        await expect(prompt.handle(parameters, client, grant, session, consent)).resolves.toEqual<Entities>(expected);
      }
    );
  });
});
