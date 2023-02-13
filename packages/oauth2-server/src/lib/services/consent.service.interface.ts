import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';

/**
 * Interface of the Consent Service.
 *
 * The Consent Service contains the operations regarding the Custom OAuth 2.0 Consent.
 */
export interface ConsentServiceInterface {
  /**
   * Creates a Consent representing the consent given to the Client by the End-User.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param session Session containing the Authentication of the End User.
   * @returns Generated Consent.
   */
  create(parameters: Record<string, any>, session: Session): Promise<Consent>;

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
