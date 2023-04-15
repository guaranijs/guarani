import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { LoginPrompt } from './login.prompt';
import { PromptInterface } from './prompt.interface';
import { Prompt } from './prompt.type';

type Entities = [Grant | null, Session | null, Consent | null];

describe('Login Prompt', () => {
  let container: DependencyInjectionContainer;
  let prompt: LoginPrompt;

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

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind(LoginPrompt).toSelf().asSingleton();

    prompt = container.resolve(LoginPrompt);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "login" as its value.', () => {
      expect(prompt.name).toEqual<Prompt>('login');
    });
  });

  describe('handle()', () => {
    let context: AuthorizationContext<AuthorizationRequest>;

    beforeEach(() => {
      context = <AuthorizationContext<AuthorizationRequest>>{
        parameters: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://example.com/callback',
          scope: 'foo bar',
          state: 'client_state',
          prompt: 'login',
        },
        client: { id: 'client_id' },
      };
    });

    it.each<Consent | null>([null, <Consent>{ id: 'consent_id' }])(
      'should return null actors when performing a fresh authentication.',
      async (consent) => {
        const grant = null;
        const session = null;

        await expect(prompt.handle(context, grant, session, consent)).resolves.toEqual<Entities>([null, null, consent]);
      }
    );

    it.each<Consent | null>([null, <Consent>{ id: 'consent_id' }])(
      'should return a simple grant when accessing the login endpoint but not authenticating.',
      async (consent) => {
        const grant = <Grant>{ id: 'grant_id' };
        const session = null;

        await expect(prompt.handle(context, grant, session, consent)).resolves.toEqual<Entities>([
          grant,
          null,
          consent,
        ]);
      }
    );

    it('should throw after authenticating at the login endpoint with no previous consent.', async () => {
      const grant = <Grant>{ id: 'grant_id', session: { id: 'session_id' } };
      const session = null;
      const consent = null;

      await expect(prompt.handle(context, grant, session, consent)).rejects.toThrow(
        new ConsentRequiredException({ state: 'client_state' })
      );

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.remove).toHaveBeenCalledWith(grant.session!);

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(grant);
    });

    it('should not throw when authenticating with no previous consent if the client requested the prompt "login consent".', async () => {
      const prompts = [
        jest.mocked<PromptInterface>({ name: 'login', handle: jest.fn() }),
        jest.mocked<PromptInterface>({ name: 'consent', handle: jest.fn() }),
      ];

      Object.assign(context, { parameters: { prompt: 'login consent' }, prompts });

      const grant = <Grant>{ id: 'grant_id', session: { id: 'session_id' } };
      const session = null;
      const consent = null;

      await expect(prompt.handle(context, grant, session, consent)).resolves.toEqual<Entities>([
        grant,
        grant.session!,
        null,
      ]);

      expect(grantServiceMock.remove).not.toHaveBeenCalled();
    });

    it.each<Consent | null>([null, <Consent>{ id: 'consent_id' }])(
      'should discard a previous authentication.',
      async (consent) => {
        const grant = null;
        const session = <Session>{ id: 'session_id' };

        await expect(prompt.handle(context, grant, session, consent)).resolves.toEqual<Entities>([null, null, consent]);

        expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
        expect(sessionServiceMock.remove).toHaveBeenCalledWith(session);
      }
    );

    it('should return an authenticated grant and a consent when authenticating at the login endpoint with a previous consent.', async () => {
      const grant = <Grant>{ id: 'grant_id', session: { id: 'session_id' } };
      const session = null;
      const consent = <Consent>{ id: 'consent_id' };

      await expect(prompt.handle(context, grant, session, consent)).resolves.toEqual<Entities>([
        grant,
        grant.session!,
        consent,
      ]);
    });
  });
});
