import { DependencyInjectionContainer } from '@guarani/di';

import { SelectAccountContextInteractionContext } from '../context/interaction/select-account-context.interaction-context';
import { SelectAccountDecisionInteractionContext } from '../context/interaction/select-account-decision.interaction-context';
import { Client } from '../entities/client.entity';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { Logger } from '../logger/logger';
import { SelectAccountContextInteractionResponse } from '../responses/interaction/select-account-context.interaction-response';
import { SelectAccountDecisionInteractionResponse } from '../responses/interaction/select-account-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { SelectAccountInteractionType } from './select-account.interaction-type';

jest.mock('../logger/logger');
describe('Select Account Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: SelectAccountInteractionType;

  const loggerMock = jest.mocked(Logger.prototype);

  const settings = <Settings>{ issuer: 'https://server.example.com' };

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

    container.bind(Logger).toValue(loggerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind(SelectAccountInteractionType).toSelf().asSingleton();

    interactionType = container.resolve(SelectAccountInteractionType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "select_account" as its name.', () => {
      expect(interactionType.name).toEqual<InteractionType>('select_account');
    });
  });

  describe('handleContext()', () => {
    let context: SelectAccountContextInteractionContext;
    let client: Client;
    let login0: Login;
    let login1: Login;
    let login2: Login;
    let grant: Grant;
    let session: Session;

    beforeEach(() => {
      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      login0 = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login0_id' });
      login1 = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login1_id' });
      login2 = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login2_id' });

      grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar baz',
          state: 'client_state',
        },
        expiresAt: new Date(Date.now() + 300000),
        client,
      });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        logins: [login0, login1, login2],
      });

      context = <SelectAccountContextInteractionContext>{
        parameters: {
          interaction_type: 'select_account',
          login_challenge: 'login_challenge',
          session_id: 'session_id',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'select_account',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        },
        grant,
        session,
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a valid select account context response.', async () => {
      await expect(
        interactionType.handleContext(context),
      ).resolves.toStrictEqual<SelectAccountContextInteractionResponse>({
        logins: ['login0_id', 'login1_id', 'login2_id'],
        context: {
          display: undefined,
          prompts: undefined,
          ui_locales: undefined,
        },
      });
    });
  });

  describe('handleDecision()', () => {
    let context: SelectAccountDecisionInteractionContext;
    let client: Client;
    let login1: Login;
    let login2: Login;
    let grant: Grant;
    let session: Session;

    beforeEach(() => {
      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      login1 = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login1_id' });
      login2 = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login2_id' });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: null,
        logins: [login1, login2],
      });

      grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
        id: 'grant_id',
        loginChallenge: 'login_challenge',
        parameters: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar baz',
          state: 'client_state',
          response_mode: 'query',
        },
        interactions: [],
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
      });

      context = <SelectAccountDecisionInteractionContext>{
        parameters: {
          interaction_type: 'select_account',
          login_challenge: 'login_challenge',
          login_id: 'login1_id',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'select_account',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        },
        grant,
        login: login1,
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.',
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
    });

    it('should return a valid first time select account decision interaction response.', async () => {
      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(
        interactionType.handleDecision(context),
      ).resolves.toStrictEqual<SelectAccountDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith({ ...session, activeLogin: login1 });

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith({
        ...grant,
        session: { ...session, activeLogin: login1 },
        interactions: ['select_account'],
      });
    });

    it('should return a valid subsequent select account decision interaction response.', async () => {
      Reflect.set(grant, 'interactions', ['select_account']);

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(
        interactionType.handleDecision(context),
      ).resolves.toStrictEqual<SelectAccountDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(sessionServiceMock.save).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });
  });
});
