import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { User } from '../entities/user.entity';

/**
 * Interface of the Consent Service.
 *
 * The Consent Service contains the operations regarding the Custom OAuth 2.0 Consent.
 */
export interface ConsentServiceInterface {
  /**
   * Creates a Consent representing the consent given to the Client by the End User.
   *
   * @param scopes Scopes granted to the Client by the End User.
   * @param client Client requesting authorization.
   * @param user Authenticated User granting authorization.
   * @returns Generated Consent.
   */
  create(scopes: string[], client: Client, user: User): Promise<Consent>;

  /**
   * Searches the application's storage for a Consent containing the provided Identifier.
   *
   * @param id Identifier of the Consent.
   * @returns Consent based on the provided Identifier.
   */
  findOne(id: string): Promise<Consent | null>;

  /**
   * Persists the provided Consent into the application's storage.
   *
   * @param consent Consent to be persisted.
   */
  save(consent: Consent): Promise<void>;

  /**
   * Removes the provided Consent.
   *
   * @param consent Consent to be removed.
   */
  remove(consent: Consent): Promise<void>;
}
