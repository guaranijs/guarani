import { Nullable } from '@guarani/types';

import { Login } from './login.entity';

/**
 * OAuth 2.0 Session Entity.
 */
export interface Session {
  /**
   * Identifier of the Session.
   */
  readonly id: string;

  /**
   * Currently active Login.
   */
  activeLogin: Nullable<Login>;

  /**
   * Logins created within the Session.
   */
  logins: Login[];
}
