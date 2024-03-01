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
      const logoutTicket = <LogoutTicket>{
        id: 'logout_ticket_id',
        session: <Session>{
          id: 'session1_id',
          activeLogin: <Login>{
            id: 'login1_id',
            user: <User>{ id: 'user_id' },
          },
        },
      };

      const logins = [
        <Login>{
          id: 'login1_id',
          session: <Session>{ id: 'session1_id' },
          user: <User>{ id: 'user_id' },
          clients: [<Client>{ id: 'client1_id' }, <Client>{ id: 'client2_id' }, <Client>{ id: 'client3_id' }],
        },
        <Login>{
          id: 'login2_id',
          session: <Session>{ id: 'session2_id' },
          user: <User>{ id: 'user_id' },
          clients: [<Client>{ id: 'client1_id' }, <Client>{ id: 'client2_id' }, <Client>{ id: 'client4_id' }],
        },
        <Login>{
          id: 'login3_id',
          session: <Session>{ id: 'session3_id' },
          user: <User>{ id: 'user_id' },
          clients: [<Client>{ id: 'client2_id' }, <Client>{ id: 'client3_id' }, <Client>{ id: 'client4_id' }],
        },
      ];

      loginServiceMock.findByUserId.mockResolvedValueOnce(logins);

      await expect(logoutType.logout(logoutTicket)).resolves.not.toThrow();

      expect(authHandlerMock.logout).toHaveBeenCalledTimes(3);

      expect(authHandlerMock.logout).toHaveBeenNthCalledWith(1, logins[0], logins[0]!.session);
      expect(authHandlerMock.logout).toHaveBeenNthCalledWith(2, logins[1], logins[1]!.session);
      expect(authHandlerMock.logout).toHaveBeenNthCalledWith(3, logins[2], logins[2]!.session);

      expect(logoutHandlerMock.notifyClient).toHaveBeenCalledTimes(9);

      for (let i = 0; i < 9; i++) {
        const login = logins[Math.floor(i / 3)]!;
        expect(logoutHandlerMock.notifyClient).toHaveBeenNthCalledWith(i + 1, login.clients[i % 3], login.user, login);
      }
    });
  });
});
