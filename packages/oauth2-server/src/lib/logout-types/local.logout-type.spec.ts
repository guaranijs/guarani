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
      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        session: <Session>{
          id: 'session_id',
          activeLogin: <Login>{
            id: 'login_id',
            clients: [
              <Client>{ id: 'client1_id' },
              <Client>{ id: 'client2_id' },
              <Client>{ id: 'client3_id' },
              <Client>{ id: 'client4_id' },
            ],
          },
        },
      };

      await expect(logoutType.logout(logoutTicket)).resolves.not.toThrow();

      const login = logoutTicket.session.activeLogin!;

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(1);
      expect(authHandlerMock.logout).toHaveBeenCalledWith(login, logoutTicket.session);

      expect(logoutHandlerMock.notifyClient).toHaveBeenCalledTimes(4);

      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(1, login.clients[0], null, login);
      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(2, login.clients[1], null, login);
      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(3, login.clients[2], null, login);
      expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(4, login.clients[3], null, login);
    });
  });
});
