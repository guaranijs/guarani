import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

/**
 * Interface of the Session Service.
 *
 * The Session Service contains the operations regarding the Custom OAuth 2.0 Session.
 */
export interface SessionServiceInterface {
  /**
   * Creates a Session representing the End User's Authentication.
   *
   * @param user Authenticated End User.
   * @returns Generated Session.
   */
  create(user: User): Promise<Session>;

  /**
   * Searches the application's storage for a Session containing the provided Identifier.
   *
   * @param id Identifier of the Session.
   * @returns Session based on the provided Identifier.
   */
  findOne(id: string): Promise<Session | null>;

  /**
   * Persists the provided Session into the application's storage.
   *
   * @param session Session to be persisted.
   */
  save(session: Session): Promise<void>;

  /**
   * Removes the provided Session.
   *
   * @param session Session to be removed.
   */
  remove(session: Session): Promise<void>;
}
