import { RegistrationRequest } from '../requests/registration-request';

/**
 * Parameters of the OAuth 2.0 Registration Response.
 */
export interface RegistrationResponse extends RegistrationRequest {
  /**
   * Unique Identifier of the Client.
   */
  readonly client_id: string;

  /**
   * Secret of the Client.
   */
  readonly client_secret: string;

  /**
   * Time the Identifier of the Client was issued, represented as Unix time.
   */
  readonly client_id_issued_at: number;

  /**
   * Time the Secret of the Client will expire, represented as Unix time.
   *
   * *note: the value **0** indicates that the secret will not expire.*
   */
  readonly client_secret_expires_at: number;

  /**
   * Registration Access Token used at the Client Configuration Endpoint to handle the Client Registration.
   */
  readonly registration_access_token?: string;

  /**
   * Client Configuration Endpoint where the Client uses its Registration Access Token to handle its Registration.
   */
  readonly registration_client_uri?: string;
}
