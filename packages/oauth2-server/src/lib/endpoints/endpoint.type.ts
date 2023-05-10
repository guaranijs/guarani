/**
 * Endpoints supported by Guarani.
 */
export type Endpoint =
  | 'authorization'
  | 'device_authorization'
  | 'discovery'
  | 'end_session'
  | 'interaction'
  | 'introspection'
  | 'jwks'
  | 'registration'
  | 'revocation'
  | 'token'
  | 'userinfo';
