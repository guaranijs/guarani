import { Dictionary, Nullable } from '@guarani/types';

import { Login } from './login.entity';

/**
 * OAuth 2.0 Session Entity.
 */
export abstract class Session implements Dictionary<any> {
  /**
   * Identifier of the Session.
   */
  public readonly id!: string;

  /**
   * Currently active Login.
   */
  public activeLogin!: Nullable<Login>;

  /**
   * Logins created within the Session.
   */
  public logins!: Login[];

  /**
   * Additional Session Parameters.
   */
  [parameter: string]: unknown;
}
