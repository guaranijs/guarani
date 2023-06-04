import { TokenResponse } from '../token-response';
import { AuthorizationResponse } from './authorization-response';

/**
 * Parameters of the **Token** Authorization Response.
 */
export interface TokenAuthorizationResponse extends AuthorizationResponse, TokenResponse {}
