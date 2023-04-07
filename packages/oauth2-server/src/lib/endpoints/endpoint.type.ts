/**
 * Endpoints supported by Guarani.
 */
export type Endpoint =
  | 'authorization'
  | 'device_authorization'
  | 'discovery'
  | 'interaction'
  | 'introspection'
  | 'jwks'
  | 'revocation'
  | 'token'
  | 'userinfo';
