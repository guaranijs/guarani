import { Client } from '../entities/client.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';

/**
 * Interface of the Grant Service.
 *
 * The Grant Service contains the operations regarding the OAuth 2.0 Grant.
 */
export interface GrantServiceInterface {
  /**
   * Creates a Grant used to authenticate an End User at the Authorization Server.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client requesting authorization.
   * @param session Session containing the Logins for the User-Agent.
   * @returns Generated Grant.
   */
  create(parameters: AuthorizationRequest, client: Client, session: Session): Promise<Grant>;

  /**
   * Searches the application's storage for a Grant containing the provided Identifier.
   *
   * @param id Identifier of the Grant.
   * @returns Grant based on the provided Identifier.
   */
  findOne(id: string): Promise<Grant | null>;

  /**
   * Searches the application's storage for a Grant containing the provided Login Challenge.
   *
   * @param loginChallenge Login Challenge of the Grant.
   * @returns Grant based on the provided Login Challenge.
   */
  findOneByLoginChallenge(loginChallenge: string): Promise<Grant | null>;

  /**
   * Searches the application's storage for a Grant containing the provided Consent Challenge.
   *
   * @param consentChallenge Consent Challenge of the Grant.
   * @returns Grant based on the provided Consent Challenge.
   */
  findOneByConsentChallenge(consentChallenge: string): Promise<Grant | null>;

  /**
   * Persists the provided Grant into the application's storage.
   *
   * @param grant Grant to be persisted.
   */
  save(grant: Grant): Promise<void>;

  /**
   * Removes the provided Grant.
   *
   * @param grant Grant to be removed.
   */
  remove(grant: Grant): Promise<void>;
}
