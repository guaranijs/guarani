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
    'EdDSA',
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
  idTokenSignatureAlgorithms: [
    'ES256',
    'ES384',
    'ES512',
    'EdDSA',
    'PS256',
    'PS384',
    'PS512',
    'RS256',
    'RS384',
    'RS512',
  ],
  idTokenKeyWrapAlgorithms: [
    'A128GCMKW',
    'A128KW',
    'A192GCMKW',
    'A192KW',
    'A256GCMKW',
    'A256KW',
    'ECDH-ES',
    'ECDH-ES+A128KW',
    'ECDH-ES+A192KW',
    'ECDH-ES+A256KW',
    'RSA-OAEP',
    'RSA-OAEP-256',
    'RSA-OAEP-384',
    'RSA-OAEP-512',
    'RSA1_5',
    'dir',
  ],
  idTokenContentEncryptionAlgorithms: [
    'A128CBC-HS256',
    'A128GCM',
    'A192CBC-HS384',
    'A192GCM',
    'A256CBC-HS512',
    'A256GCM',
  ],
  userinfoSignatureAlgorithms: [
    'ES256',
    'ES384',
    'ES512',
    'EdDSA',
    'PS256',
    'PS384',
    'PS512',
    'RS256',
    'RS384',
    'RS512',
  ],
  userinfoKeyWrapAlgorithms: [
    'A128GCMKW',
    'A128KW',
    'A192GCMKW',
    'A192KW',
    'A256GCMKW',
    'A256KW',
    'ECDH-ES',
    'ECDH-ES+A128KW',
    'ECDH-ES+A192KW',
    'ECDH-ES+A256KW',
    'RSA-OAEP',
    'RSA-OAEP-256',
    'RSA-OAEP-384',
    'RSA-OAEP-512',
    'RSA1_5',
    'dir',
  ],
  userinfoContentEncryptionAlgorithms: [
    'A128CBC-HS256',
    'A128GCM',
    'A192CBC-HS384',
    'A192GCM',
    'A256CBC-HS512',
    'A256GCM',
  ],
  authorizationSignatureAlgorithms: [
    'ES256',
    'ES384',
    'ES512',
    'EdDSA',
    'PS256',
    'PS384',
    'PS512',
    'RS256',
    'RS384',
    'RS512',
  ],
  authorizationKeyWrapAlgorithms: [
    'A128GCMKW',
    'A128KW',
    'A192GCMKW',
    'A192KW',
    'A256GCMKW',
    'A256KW',
    'ECDH-ES',
    'ECDH-ES+A128KW',
    'ECDH-ES+A192KW',
    'ECDH-ES+A256KW',
    'RSA-OAEP',
    'RSA-OAEP-256',
    'RSA-OAEP-384',
    'RSA-OAEP-512',
    'RSA1_5',
    'dir',
  ],
  authorizationContentEncryptionAlgorithms: [
    'A128CBC-HS256',
    'A128GCM',
    'A192CBC-HS384',
    'A192GCM',
    'A256CBC-HS512',
    'A256GCM',
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
  responseModes: ['form_post', 'form_post.jwt', 'fragment', 'fragment.jwt', 'jwt', 'query', 'query.jwt'],
  pkces: ['S256', 'plain'],
  acrValues: ['urn:guarani:acr:1fa', 'urn:guarani:acr:2fa'],
  uiLocales: ['en', 'es', 'pt-BR'],
  subjectTypes: ['pairwise', 'public'],
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
    deviceCodeUrl: '/device',
    errorUrl: '/oauth/error',
    loginUrl: '/auth/login',
    logoutUrl: '/auth/logout',
  },
  enableRegistrationEndpoint: true,
  enableBackChannelLogout: true,
  includeSessionIdInLogoutToken: true,
  enableAuthorizationResponseIssuerIdentifier: true,
  postLogoutUrl: 'http://localhost:3000',
  secretKey: 'super_secret_passphrase_that_nobody_will_be_able_to_guess',
});
