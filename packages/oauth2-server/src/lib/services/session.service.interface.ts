import { Client } from '../entities/client.entity';
import { Session } from '../entities/session.entity';

/**
 * Interface of the Session Service.
 *
 * The Session Service contains the operations regarding the Custom OAuth 2.0 Session.
 */
export interface SessionServiceInterface {
  /**
   * Creates a Session representing the consent given to the Client by the End-User.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client requesting authorization.
   * @returns Generated Session.
   */
  create(parameters: Record<string, any>, client: Client): Promise<Session>;

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
