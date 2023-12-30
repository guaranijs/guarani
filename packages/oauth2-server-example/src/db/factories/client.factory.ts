import { Faker } from '@faker-js/faker';
import { define } from '@paranode/typeorm-seeding';

import { Client } from '../../app/entities/client.entity';

define(Client, (faker: Faker): Client => {
  return Client.create({
    id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
    secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
    name: 'Guarani Dev #1',
    redirectUris: ['http://localhost:4000/auth/callback'],
    responseTypes: [
      'code id_token token',
      'code id_token',
      'code token',
      'code',
      'id_token token',
      'id_token',
      'token',
    ],
    grantTypes: [
      'authorization_code',
      'client_credentials',
      'password',
      'refresh_token',
      'urn:ietf:params:oauth:grant-type:device_code',
      'urn:ietf:params:oauth:grant-type:jwt-bearer',
    ],
    applicationType: 'web',
    authenticationMethod: 'client_secret_basic',
    scopes: ['openid', 'profile', 'email', 'phone', 'address'],
    clientUri: 'http://localhost:4000',
    logoUri: faker.image.avatar(),
    contacts: [faker.internet.email()],
    policyUri: 'http://localhost:4000/policy',
    tosUri: 'http://localhost:4000/terms-of-service',
    subjectType: 'public',
    idTokenSignedResponseAlgorithm: 'ES256',
    defaultMaxAge: 86400,
    requireAuthTime: true,
    postLogoutRedirectUris: ['http://localhost:4000/auth/logout_callback'],
    backChannelLogoutUri: 'http://localhost:4000/auth/back_channel',
    backChannelLogoutSessionRequired: true,
  });
});
