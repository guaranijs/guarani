import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { AuthHandler } from '../handlers/auth.handler';
import { LogoutHandler } from '../handlers/logout.handler';
import { Logger } from '../logger/logger';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { LogoutType } from './logout-type.type';
import { SsoLogoutType } from './sso.logout-type';

jest.mock('../handlers/auth.handler');
jest.mock('../handlers/logout.handler');
jest.mock('../logger/logger');

describe('SSO Logout Type', () => {
  let container: DependencyInjectionContainer;
  let logoutType: SsoLogoutType;

  const loggerMock = jest.mocked(Logger.prototype);
  const authHandlerMock = jest.mocked(AuthHandler.prototype);
  const logoutHandlerMock = jest.mocked(LogoutHandler.prototype);

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
    container.bind(AuthHandler).toValue(authHandlerMock);
    container.bind(LogoutHandler).toValue(logoutHandlerMock);
    container.bind<LoginServiceInterface>(LOGIN_SERVICE).toValue(loginServiceMock);
    container.bind(SsoLogoutType).toSelf().asSingleton();

    logoutType = container.resolve(SsoLogoutType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "sso" as its name.', () => {
      expect(logoutType.name).toEqual<LogoutType>('sso');
    });
  });

  describe('logout()', () => {
    it('should logout all clients from the all logins.', async () => {
      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const activeLogin: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login1_id',
        user,
      });

      const session: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session1_id',
        activeLogin,
      });

      const logoutTicket: LogoutTicket = Object.assign<LogoutTicket, Partial<LogoutTicket>>(
        Reflect.construct(LogoutTicket, []),
        { id: 'logout_ticket_id', session },
      );

      const client1: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client1_id',
      });

      const client2: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client2_id',
      });

      const client3: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client3_id',
      });

      const client4: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client4_id',
      });

      const session1: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session1_id',
      });

      const session2: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session2_id',
      });

      const session3: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session3_id',
      });

      const login1: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login1_id',
        session: session1,
        user,
        clients: [client1, client2, client3],
      });

      const login2: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login2_id',
        session: session2,
        user,
        clients: [client1, client2, client4],
      });

      const login3: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login3_id',
        session: session3,
        user,
        clients: [client2, client3, client4],
      });

      const logins = [login1, login2, login3];

      loginServiceMock.findByUserId.mockResolvedValueOnce(logins);

      await expect(logoutType.logout(logoutTicket)).resolves.not.toThrow();

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(3);

      expect(authHandlerMock.logout).toHaveBeenNthCalledWith(1, login1, session1);
      expect(authHandlerMock.logout).toHaveBeenNthCalledWith(2, login2, session2);
      expect(authHandlerMock.logout).toHaveBeenNthCalledWith(3, login3, session3);

      expect(logoutHandlerMock.notifyClient).toHaveBeenCalledTimes(9);

      for (let i = 0; i < 9; i++) {
        const login = logins[Math.floor(i / 3)]!;
        expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(i + 1, login.clients[i % 3], user, login);
      }
    });
  });
});
