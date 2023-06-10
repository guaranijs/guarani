import { URLSearchParams } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { CreateContextInteractionContext } from '../context/interaction/create-context.interaction-context';
import { CreateDecisionInteractionContext } from '../context/interaction/create-decision.interaction-context';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { CreateContextInteractionResponse } from '../responses/interaction/create-context.interaction-response';
import { CreateDecisionInteractionResponse } from '../responses/interaction/create-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { CreateInteractionType } from './create.interaction-type';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

describe('Create Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: CreateInteractionType;

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

  const loginServiceMock = jest.mocked<LoginServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  });

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<GrantServiceInterface>(GRANT_SERVICE).toValue(grantServiceMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
    container.bind<LoginServiceInterface>(LOGIN_SERVICE).toValue(loginServiceMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
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

    beforeEach(() => {
      const now = Date.now();

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
        grant: <Grant>{
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
          client: { id: 'client_id' },
          session: {
            id: 'session_id',
            activeLogin: null,
            logins: <Login[]>[],
          },
        },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.'
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should return a valid skip create context response.', async () => {
      context.grant.interactions.push('create');

      const parameters = new URLSearchParams(context.grant.parameters as Dictionary<any>);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<CreateContextInteractionResponse>({
        skip: true,
        request_url: `https://server.example.com/oauth/authorize?${parameters.toString()}`,
        context: {
          display: undefined,
          prompts: ['create'],
          ui_locales: undefined,
        },
      });
    });

    it('should return a valid non-skip create context response.', async () => {
      const parameters = new URLSearchParams(context.grant.parameters as Dictionary<any>);

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<CreateContextInteractionResponse>({
        skip: false,
        request_url: `https://server.example.com/oauth/authorize?${parameters.toString()}`,
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

    beforeEach(() => {
      const now = Date.now();

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
        grant: <Grant>{
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
          client: { id: 'client_id' },
          session: {
            id: 'session_id',
            activeLogin: null,
            logins: <Login[]>[],
          },
        },
        user: <User>{ id: 'user_id' },
      };
    });

    it('should throw when the grant is expired.', async () => {
      Reflect.set(context.grant, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Grant.'
      );

      expect(grantServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.remove).toHaveBeenCalledWith(context.grant);
    });

    it('should return a valid first time create decision interaction response.', async () => {
      const parameters = new URLSearchParams(context.grant.parameters as Dictionary<any>);

      const { grant } = context;

      const user = <User>{ id: 'user_id' };
      const login = <Login>{ id: 'login_id', user };

      userServiceMock.create.mockResolvedValueOnce(user);
      loginServiceMock.create.mockResolvedValueOnce(login);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<CreateDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/authorize?${parameters.toString()}`,
      });

      expect(userServiceMock.create).toHaveBeenCalledTimes(1);
      expect(userServiceMock.create).toHaveBeenCalledWith(context.parameters);

      expect(loginServiceMock.create).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.create).toHaveBeenCalledWith(user, grant.session, null, null);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      });

      expect(grantServiceMock.save).toHaveBeenCalledTimes(1);
      expect(grantServiceMock.save).toHaveBeenCalledWith(<Grant>{
        ...grant,
        interactions: ['create'],
        session: { id: 'session_id', activeLogin: login, logins: [login] },
      });
    });

    it('should return a valid subsequent create decision interaction response.', async () => {
      context.grant.interactions.push('create');

      const parameters = new URLSearchParams(context.grant.parameters as Dictionary<any>);

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<CreateDecisionInteractionResponse>({
        redirect_to: `https://server.example.com/oauth/authorize?${parameters.toString()}`,
      });

      expect(userServiceMock.create).not.toHaveBeenCalled();
      expect(loginServiceMock.create).not.toHaveBeenCalled();
      expect(sessionServiceMock.save).not.toHaveBeenCalled();
      expect(grantServiceMock.save).not.toHaveBeenCalled();
    });
  });
});
