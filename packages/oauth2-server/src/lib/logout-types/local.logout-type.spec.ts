import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';
import { AuthHandler } from '../handlers/auth.handler';
import { LogoutHandler } from '../handlers/logout.handler';
import { Logger } from '../logger/logger';
import { LocalLogoutType } from './local.logout-type';
import { LogoutType } from './logout-type.type';

jest.mock('../handlers/auth.handler');
jest.mock('../handlers/logout.handler');
jest.mock('../logger/logger');

describe('Local Logout Type', () => {
  let container: DependencyInjectionContainer;
  let logoutType: LocalLogoutType;

  const loggerMock = jest.mocked(Logger.prototype);
  const authHandlerMock = jest.mocked(AuthHandler.prototype);
  const logoutHandlerMock = jest.mocked(LogoutHandler.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(AuthHandler).toValue(authHandlerMock);
    container.bind(LogoutHandler).toValue(logoutHandlerMock);
    container.bind(LocalLogoutType).toSelf().asSingleton();

    logoutType = container.resolve(LocalLogoutType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "local" as its name.', () => {
      expect(logoutType.name).toEqual<LogoutType>('local');
    });
  });

  describe('logout()', () => {
    it('should logout all clients from the local login.', async () => {
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

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), {
        id: 'login_id',
        clients: [client1, client2, client3, client4],
      });

      const session: Session = Object.assign<Session, Partial<Session>>(Reflect.construct(Session, []), {
        id: 'session_id',
        activeLogin: login,
      });

      const logoutTicket: LogoutTicket = Object.assign<LogoutTicket, Partial<LogoutTicket>>(
        Reflect.construct(LogoutTicket, []),
        { id: 'logout_ticket_id', session },
      );

      await expect(logoutType.logout(logoutTicket)).resolves.not.toThrow();

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.logout).toHaveBeenCalledWith(login, session);

      expect(logoutHandlerMock.notifyClient).toHaveBeenCalledTimes(4);

      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(1, login.clients[0], null, login);
      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(2, login.clients[1], null, login);
      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(3, login.clients[2], null, login);
      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(4, login.clients[3], null, login);
    });
  });
});
