/**
 * Grant Types supported by Guarani.
 */
export type GrantType =
  | 'authorization_code'
  | 'client_credentials'
  | 'password'
  | 'refresh_token'
  | 'urn:ietf:params:oauth:grant-type:jwt-bearer';
