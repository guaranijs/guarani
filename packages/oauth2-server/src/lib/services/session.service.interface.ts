import { Session } from '../entities/session.entity';

/**
 * Interface of the Session Service.
 *
 * The Session Service contains the operations regarding the OAuth 2.0 Session.
 */
export interface SessionServiceInterface {
  /**
   * Creates a Session Entity to store the Sessions created at the Device for multi-account.
   *
   * @returns Newly created Session Entity.
   */
  create(): Promise<Session>;

  /**
   * Searches the application's storage for a Session Entity containing the provided Identifier.
   *
   * @param id Identifier of the Session Entity.
   * @returns Session Entity based on the provided Identifier.
   */
  findOne(id: string): Promise<Session | null>;

  /**
   * Persists the provided Session Entity into the application's storage.
   *
   * @param session Session Entity to be persisted.
   */
  save(session: Session): Promise<void>;

  /**
   * Removes the provided Session Entity from the application's storage.
   *
   * @param session Session Entity to be removed.
   */
  remove(session: Session): Promise<void>;
}
