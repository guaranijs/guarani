import { DependencyInjectionContainer } from '@guarani/di';

import { CreateContextInteractionContext } from '../context/interaction/create-context.interaction-context';
import { CreateDecisionInteractionContext } from '../context/interaction/create-decision.interaction-context';
import { Client } from '../entities/client.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AuthHandler } from '../handlers/auth.handler';
import { Logger } from '../logger/logger';
import { CreateContextInteractionResponse } from '../responses/interaction/create-context.interaction-response';
import { CreateDecisionInteractionResponse } from '../responses/interaction/create-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { CreateInteractionType } from './create.interaction-type';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

jest.mock('../logger/logger');
jest.mock('../handlers/auth.handler');

describe('Create Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: CreateInteractionType;

  const loggerMock = jest.mocked(Logger.prototype);

  const authHandlerMock = jest.mocked(AuthHandler.prototype);

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const grantServiceMock = jest.mocked<GrantServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByConsentChallenge: jest.fn(),
    findOneByLoginChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const userServiceMock = jest.mocked<UserServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(AuthHandler).toValue(authHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
    container.bind(CreateInteractionType).toSelf().asSingleton();

    interactionType = container.resolve(CreateInteractionType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "create" as its name.', () => {
      expect(interactionType.name).toEqual<InteractionType>('create');
    });
  });

  describe('handleContext()', () => {
    let context: CreateContextInteractionContext;
    let client: Client;
    let session: Session;
    let grant: Grant;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: null,
        logins: [],
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
          prompt: 'create',
        },
        interactions: [],
        expiresAt: new Date(now + 300000),
        client,
        session,
      });

      context = <CreateContextInteractionContext>{
        parameters: {
          interaction_type: 'create',
          login_challenge: 'login_challenge',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'create',
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

    it('should return a valid skip create context response.', async () => {
      grant.interactions.push('create');

      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<CreateContextInteractionResponse>({
        skip: true,
        request_url: requestUrl.href,
        context: {
          display: undefined,
          prompts: ['create'],
          ui_locales: undefined,
        },
      });
    });

    it('should return a valid non-skip create context response.', async () => {
      const requestUrl = addParametersToUrl('https://server.example.com/oauth/authorize', context.grant.parameters);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<CreateContextInteractionResponse>({
        skip: false,
        request_url: requestUrl.href,
        context: {
          display: undefined,
          prompts: ['create'],
          ui_locales: undefined,
        },
      });
    });
  });

  describe('handleDecision()', () => {
    let context: CreateDecisionInteractionContext;
    let client: Client;
    let session: Session;
    let grant: Grant;
    let user: User;

    beforeEach(() => {
      const now = Date.now();

      client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: null,
        logins: [],
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
          prompt: 'create',
        },
        interactions: <InteractionType[]>[],
        expiresAt: new Date(now + 300000),
        client,
        session,
      });

      user = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      context = <CreateDecisionInteractionContext>{
        parameters: {
          interaction_type: 'create',
          login_challenge: 'login_challenge',
        },
        interactionType: jest.mocked<InteractionTypeInterface>({
          name: 'create',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        }),
        grant,
        user,
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

    it('should return a valid first time create decision interaction response.', async () => {
      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      userServiceMock.create.mockResolvedValueOnce(user);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<CreateDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(userServiceMock.create).toHaveBeenCalledTimes(1);
      expect(userServiceMock.create).toHaveBeenCalledWith(context.parameters);

      expect(authHandlerMock.login).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.login).toHaveBeenCalledWith(user, client, session, null, null);

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{ ...grant, interactions: ['create'] });
    });

    it('should return a valid subsequent create decision interaction response.', async () => {
      grant.interactions.push('create');

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/authorize', grant.parameters);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<CreateDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(userServiceMock.create).not.toHaveBeenCalled();
      expect(authHandlerMock.login).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });
  });
});
