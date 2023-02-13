import { AuthorizationResponse } from './authorization-response';
import { TokenResponse } from './token-response';

/**
 * Parameters of the **Token** Authorization Response.
 */
export interface TokenAuthorizationResponse extends AuthorizationResponse, TokenResponse {}
