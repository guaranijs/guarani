import { Dictionary } from '@guarani/types';

/**
 * Parameters of the Login Context.
 */
export interface LogoutContext extends Dictionary<any> {
  /**
   * Hint about the Identifier that the User might use for logout.
   */
  readonly logout_hint?: string;

  /**
   * End-User's preferred languages and scripts for the User Interface.
   */
  readonly ui_locales?: string[];
}
