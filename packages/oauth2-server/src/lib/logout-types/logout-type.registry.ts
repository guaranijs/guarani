import { Constructor } from '@guarani/types';

import { LocalLogoutType } from './local.logout-type';
import { LogoutTypeInterface } from './logout-type.interface';
import { LogoutType } from './logout-type.type';
import { SsoLogoutType } from './sso.logout-type';

/**
 * Logout Type Registry.
 */
export const logoutTypeRegistry: Record<LogoutType, Constructor<LogoutTypeInterface>> = {
  local: LocalLogoutType,
  sso: SsoLogoutType,
};
