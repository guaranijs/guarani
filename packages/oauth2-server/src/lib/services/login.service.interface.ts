import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

/**
 * Interface of the Login Service.
 *
 * The Login Service contains the operations regarding the Custom OAuth 2.0 Login.
 */
export interface LoginServiceInterface {
  /**
   * Creates a Login representing the End User's Authentication.
   *
   * @param user Authenticated End User.
   * @param session Session of the Request.
   * @param amr Authentication Methods used in the Authentication.
   * @param acr Authentication Context Class Reference satisfied by the Authentication process.
   * @returns Generated Login.
   */
  create(user: User, client: Client, session: Session, amr: Nullable<string[]>, acr: Nullable<string>): Promise<Login>;

  /**
   * Searches the application's storage for a Login containing the provided Identifier.
   *
   * @param id Identifier of the Login.
   * @returns Login based on the provided Identifier.
   */
  findOne(id: string): Promise<Nullable<Login>>;

  /**
   * Searches the application's storage for all Logins based on the provided User Identifier.
   *
   * @param id Identifier of the User.
   * @returns Logins based on the provided User.
   */
  findByUserId(id: string): Promise<Login[]>;

  /**
   * Persists the provided Login Entity into the application's storage.
   *
   * @param login Login Entity to be persisted.
   */
  save(login: Login): Promise<void>;

  /**
   * Removes the provided Login.
   *
   * @param login Login to be removed.
   */
  remove(login: Login): Promise<void>;
}
