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
  activeLogin?: Login | null;

  /**
   * Logins created within the Session.
   */
  logins: Login[];
}
