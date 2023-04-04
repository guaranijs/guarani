import 'reflect-metadata';

global.console.warn = jest.fn();

Reflect.set(global, 'endToEndAuthorizationServerOptions', {
  issuer: 'http://localhost:3000',
  scopes: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
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
    'urn:ietf:params:oauth:grant-type:device_code',
    'urn:ietf:params:oauth:grant-type:jwt-bearer',
  ],
  responseTypes: ['code', 'id_token', 'token', 'code id_token', 'code token', 'id_token token', 'code id_token token'],
  responseModes: ['form_post', 'fragment', 'query'],
  pkces: ['S256', 'plain'],
  jwks: {
    keys: [
      {
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
        alg: 'ES256',
        kid: 'ec-key',
        use: 'sig',
      },
    ],
  },
  userInteraction: {
    consentUrl: '/oauth/consent',
    errorUrl: '/oauth/error',
    loginUrl: '/auth/login',
  },
  enableAuthorizationResponseIssuerIdentifier: true,
});
