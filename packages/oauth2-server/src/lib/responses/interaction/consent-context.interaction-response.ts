import { Dictionary } from '@guarani/types';

import { ConsentContext } from './consent.context';

/**
 * Parameters of the custom OAuth 2.0 Consent Context Interaction Response.
 */
export interface ConsentContextInteractionResponse extends Dictionary<any> {
  /**
   * Indicates if the application can skip displaying the consent screen.
   */
  readonly skip: boolean;

  /**
   * Scope requested by the Client.
   */
  readonly requested_scope: string;

  /**
   * Identifier of the Subject of the Authentication.
   */
  readonly subject: string;

  /**
   * Request Url.
   */
  readonly request_url: string;

  /**
   * Login Challenge of the Grant.
   */
  readonly login_challenge: string;

  /**
   * Identifier of the Client requesting authorization.
   */
  readonly client: string;

  /**
   * Context for the Consent Interaction.
   */
  readonly context: ConsentContext;
}
