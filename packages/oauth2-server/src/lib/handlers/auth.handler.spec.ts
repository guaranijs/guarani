import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { Logger } from '../logger/logger';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { AuthHandler } from './auth.handler';

jest.mock('../logger/logger');

describe('Auth Handler', () => {
  let container: DependencyInjectionContainer;
  let authHandler: AuthHandler;

  const loggerMock = jest.mocked(Logger.prototype);

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const loginServiceMock = jest.mocked<LoginServiceInterface>({
    create: jest.fn(),
    findByUserId: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<LoginServiceInterface>(LOGIN_SERVICE).toValue(loginServiceMock);
    container.bind(AuthHandler).toSelf().asSingleton();

    authHandler = container.resolve(AuthHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login()', () => {
    it('should create and return a new login.', async () => {
      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const session: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: null,
        logins: [],
      });

      const amr: string[] = ['pwd', 'sms'];

      const acr = 'urn:guarani:acr:2fa';

      loginServiceMock.create.mockResolvedValueOnce(<Login>{ id: 'login_id', amr, acr, user, session });

      const login = await authHandler.login(user, client, session, amr, acr);

      expect(loginServiceMock.create).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.create).toHaveBeenCalledWith(user, client, session, amr, acr);

      expect(loginServiceMock.remove).not.toHaveBeenCalled();

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith({
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      });
    });

    it('should remove an old login and create and return a new login.', async () => {
      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const oldLogin: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'old_login_id',
        user,
      });

      const session: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: null,
        logins: [oldLogin],
      });

      const amr: string[] = ['pwd', 'sms'];

      const acr = 'urn:guarani:acr:2fa';

      loginServiceMock.create.mockResolvedValueOnce(<Login>{ id: 'login_id', amr, acr, user, session });

      const login = await authHandler.login(user, client, session, amr, acr);

      expect(loginServiceMock.create).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.create).toHaveBeenCalledWith(user, client, session, amr, acr);

      expect(loginServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.remove).toHaveBeenCalledWith(oldLogin);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith({
        id: 'session_id',
        activeLogin: login,
        logins: [login],
      });
    });
  });

  describe('logout()', () => {
    it('should remove the active login from the session.', async () => {
      const login1: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login1' });

      const login2: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login2' });

      const session: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login1,
        logins: [login1, login2],
      });

      const login = session.activeLogin!;

      await authHandler.logout(login, session);

      expect(loginServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.remove).toHaveBeenCalledWith(login);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith({
        id: 'session_id',
        activeLogin: null,
        logins: [login2],
      });

      const removeLoginOrder = loginServiceMock.remove.mock.invocationCallOrder[0]!;
      const saveSessionOrder = sessionServiceMock.save.mock.invocationCallOrder[0]!;

      expect(removeLoginOrder).toBeLessThan(saveSessionOrder);
    });

    it('should remove a login that is not the active login from the session.', async () => {
      const login1: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login1' });

      const login2: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login2' });

      const session: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login1,
        logins: [login1, login2],
      });

      await authHandler.logout(login2, session);

      expect(loginServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.remove).toHaveBeenCalledWith(login2);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{
        id: 'session_id',
        activeLogin: login1,
        logins: [login1],
      });

      const removeLoginOrder = loginServiceMock.remove.mock.invocationCallOrder[0]!;
      const saveSessionOrder = sessionServiceMock.save.mock.invocationCallOrder[0]!;

      expect(removeLoginOrder).toBeLessThan(saveSessionOrder);
    });
  });

  describe('inactivateSessionActiveLogin()', () => {
    it('should remove the active login from the session.', async () => {
      const login1: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login1' });

      const login2: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login2' });

      const session: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login1,
        logins: [login1, login2],
      });

      await authHandler.inactivateSessionActiveLogin(session);

      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
      expect(sessionServiceMock.save).toHaveBeenCalledWith(<Session>{ ...session, activeLogin: null });
    });
  });
});
