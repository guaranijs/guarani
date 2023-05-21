/**
 * Error Codes supported by Guarani.
 */
export type ErrorCode =
  | 'access_denied'
  | 'account_selection_required'
  | 'authorization_pending'
  | 'consent_required'
  | 'expired_token'
  | 'insufficient_scope'
  | 'invalid_client'
  | 'invalid_client_metadata'
  | 'invalid_grant'
  | 'invalid_redirect_uri'
  | 'invalid_request'
  | 'invalid_scope'
  | 'invalid_token'
  | 'login_required'
  | 'server_error'
  | 'slow_down'
  | 'temporarily_unavailable'
  | 'unauthorized_client'
  | 'unmet_authentication_requirements'
  | 'unsupported_grant_type'
  | 'unsupported_interaction_type'
  | 'unsupported_response_type'
  | 'unsupported_token_type';
