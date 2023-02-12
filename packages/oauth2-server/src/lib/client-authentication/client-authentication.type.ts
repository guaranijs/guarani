/**
 * Client Authentication Methods supported by Guarani.
 */
export type ClientAuthentication =
  | 'client_secret_basic'
  | 'client_secret_jwt'
  | 'client_secret_post'
  | 'none'
  | 'private_key_jwt';
