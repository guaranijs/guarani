import 'reflect-metadata';

global.console.warn = jest.fn();

Reflect.set(global, 'endToEndAuthorizationServerOptions', {
  issuer: 'http://localhost:3000',
  scopes: ['foo', 'bar', 'baz', 'qux'],
  clientAuthenticationMethods: [
    'client_secret_basic',
    'client_secret_jwt',
    'client_secret_post',
    'none',
    'private_key_jwt',
  ],
  clientAuthenticationSignatureAlgorithms: [
    'ES256',
    'ES384',
    'ES512',
    'HS256',
    'HS384',
    'HS512',
    'PS256',
    'PS384',
    'PS512',
    'RS256',
    'RS384',
    'RS512',
  ],
  grantTypes: [
    'authorization_code',
    'client_credentials',
    'password',
    'refresh_token',
    'urn:ietf:params:oauth:grant-type:jwt-bearer',
  ],
  responseTypes: ['code', 'token'],
  responseModes: ['form_post', 'fragment', 'query'],
  pkceMethods: ['S256', 'plain'],
  userInteraction: {
    consentUrl: '/oauth/consent',
    errorUrl: '/oauth/error',
    loginUrl: '/auth/login',
  },
});
