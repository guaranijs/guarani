/**
 * Error Codes supported by Guarani.
 */
export type ErrorCode =
  | 'access_denied'
  | 'authorization_pending'
  | 'consent_required'
  | 'expired_token'
  | 'invalid_client'
  | 'invalid_grant'
  | 'invalid_request'
  | 'invalid_scope'
  | 'login_required'
  | 'server_error'
  | 'slow_down'
  | 'temporarily_unavailable'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'unsupported_interaction_type'
  | 'unsupported_response_type'
  | 'unsupported_token_type';
