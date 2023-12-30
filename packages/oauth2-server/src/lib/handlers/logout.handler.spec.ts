import { DependencyInjectionContainer } from '@guarani/di';

import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { LogoutHandler } from './logout.handler';
import { LogoutTokenHandler } from './logout-token.handler';

jest.mock('./logout-token.handler');

describe('Logout Handler', () => {
  let container: DependencyInjectionContainer;
  // let logoutHandler: LogoutHandler;

  const logoutTokenHandlerMock = jest.mocked(LogoutTokenHandler.prototype);
  const settings = <Settings>{ includeSessionIdInLogoutToken: true };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(LogoutTokenHandler).toValue(logoutTokenHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(LogoutHandler).toSelf().asSingleton();

    // logoutHandler = container.resolve(LogoutHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('notifyClient() (Back Channel)', () => {
    it.todo('should throw when failing to notify the client.');

    it.todo('should throw when timing out while notifying the client.');

    it.todo("should notify the client through it's back channel about a logout.");
  });
});
