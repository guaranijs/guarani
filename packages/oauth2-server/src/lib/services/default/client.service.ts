import { randomBytes, randomInt, randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { PostRegistrationContext } from '../../context/registration/post.registration-context';
import { PutRegistrationContext } from '../../context/registration/put.registration-context';
import { Client } from '../../entities/client.entity';
import { Logger } from '../../logger/logger';
import { ClientServiceInterface } from '../client.service.interface';

@Injectable()
export class ClientService implements ClientServiceInterface {
  protected readonly clients = <Client[]>[
    {
      id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
      secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
      name: 'Dev Client #1',
      redirectUris: ['http://localhost:4000/oauth/callback'],
      responseTypes: ['code', 'token'],
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
      scopes: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
      subjectType: 'public',
      idTokenSignedResponseAlgorithm: 'ES256',
      idTokenEncryptedResponseKeyWrap: null,
      requireAuthTime: false,
      postLogoutRedirectUris: ['http://localhost:4000/oauth/logout_callback'],
      createdAt: new Date(),
    },
  ];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Client Service. This is only recommended for development.`,
      '8ca9951f-2d4f-462e-84f7-e319842956f8',
    );
  }

  public async create(context: PostRegistrationContext): Promise<Client> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, 'a8d76fcf-7b4d-471a-bad9-c1e2df4abb8a', {
      context,
    });

    const id = randomUUID();

    const client: Client = {
      id,
      secret: this.secretToken(),
      secretExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      name: context.clientName ?? id,
      redirectUris: context.redirectUris.map((redirectUri) => redirectUri.toString()),
      responseTypes: context.responseTypes,
      grantTypes: context.grantTypes,
      applicationType: context.applicationType,
      authenticationMethod: context.authenticationMethod,
      authenticationSigningAlgorithm: context.authenticationSigningAlgorithm,
      scopes: context.scopes,
      clientUri: context.clientUri?.toString() ?? null,
      logoUri: context.logoUri?.toString() ?? null,
      contacts: context.contacts,
      policyUri: context.policyUri?.toString() ?? null,
      tosUri: context.tosUri?.toString() ?? null,
      jwksUri: context.jwksUri?.toString() ?? null,
      jwks: context.jwks,
      subjectType: context.subjectType,
      sectorIdentifierUri: context.sectorIdentifierUri?.toString() ?? null,
      pairwiseSalt: context.subjectType === 'pairwise' ? randomBytes(16).toString('hex') : null,
      idTokenSignedResponseAlgorithm: context.idTokenSignedResponseAlgorithm,
      idTokenEncryptedResponseKeyWrap: context.idTokenEncryptedResponseKeyWrap,
      idTokenEncryptedResponseContentEncryption: context.idTokenEncryptedResponseContentEncryption,
      userinfoSignedResponseAlgorithm: context.userinfoSignedResponseAlgorithm,
      userinfoEncryptedResponseKeyWrap: context.userinfoEncryptedResponseKeyWrap,
      userinfoEncryptedResponseContentEncryption: context.userinfoEncryptedResponseContentEncryption,
      // requestObjectSigningAlgorithm: context.requestObjectSigningAlgorithm,
      // requestObjectEncryptionKeyWrap: context.requestObjectEncryptionKeyWrap,
      // requestObjectEncryptionContentEncryption: context.requestObjectEncryptionContentEncryption,
      authorizationSignedResponseAlgorithm: context.authorizationSignedResponseAlgorithm,
      authorizationEncryptedResponseKeyWrap: context.authorizationEncryptedResponseKeyWrap,
      authorizationEncryptedResponseContentEncryption: context.authorizationEncryptedResponseContentEncryption,
      defaultMaxAge: context.defaultMaxAge,
      requireAuthTime: context.requireAuthTime,
      defaultAcrValues: context.defaultAcrValues,
      initiateLoginUri: context.initiateLoginUri?.toString() ?? null,
      // requestUris: context.requestUris,
      postLogoutRedirectUris:
        context.postLogoutRedirectUris?.map((postLogoutRedirectUri) => postLogoutRedirectUri.href) ?? null,
      backChannelLogoutUri: context.backChannelLogoutUri?.href ?? null,
      backChannelLogoutSessionRequired: context.backChannelLogoutSessionRequired,
      softwareId: context.softwareId,
      softwareVersion: context.softwareVersion,
      createdAt: new Date(),
    };

    this.clients.push(client);

    return client;
  }

  public async findOne(id: string): Promise<Nullable<Client>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, '54f9b1c2-f478-4fdd-840d-4728dd4060a2', { id });
    return this.clients.find((client) => client.id === id) ?? null;
  }

  public async remove(client: Client): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called remove()`, '3d2c666f-2ffc-4bba-b8fc-3d1a6838e476', { client });

    const index = this.clients.findIndex((registeredClient) => registeredClient.id === client.id);

    if (index > -1) {
      this.clients.splice(index, 1);
    }
  }

  public async update(client: Client, context: PutRegistrationContext): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called update()`, '63db326c-6790-4119-b184-85d57269c6f4', { client });

    const index = this.clients.findIndex((registeredClient) => registeredClient.id === client.id);

    Object.assign<Client, Partial<Client>>(client, {
      name: context.clientName ?? context.clientId,
      redirectUris: context.redirectUris.map((redirectUri) => redirectUri.toString()),
      responseTypes: context.responseTypes,
      grantTypes: context.grantTypes,
      applicationType: context.applicationType,
      authenticationMethod: context.authenticationMethod,
      authenticationSigningAlgorithm: context.authenticationSigningAlgorithm,
      scopes: context.scopes,
      clientUri: context.clientUri?.toString() ?? null,
      logoUri: context.logoUri?.toString() ?? null,
      contacts: context.contacts,
      policyUri: context.policyUri?.toString() ?? null,
      tosUri: context.tosUri?.toString() ?? null,
      jwksUri: context.jwksUri?.toString() ?? null,
      jwks: context.jwks,
      subjectType: context.subjectType,
      sectorIdentifierUri: context.sectorIdentifierUri?.toString() ?? null,
      idTokenSignedResponseAlgorithm: context.idTokenSignedResponseAlgorithm,
      idTokenEncryptedResponseKeyWrap: context.idTokenEncryptedResponseKeyWrap,
      idTokenEncryptedResponseContentEncryption: context.idTokenEncryptedResponseContentEncryption,
      userinfoSignedResponseAlgorithm: context.userinfoSignedResponseAlgorithm,
      userinfoEncryptedResponseKeyWrap: context.userinfoEncryptedResponseKeyWrap,
      userinfoEncryptedResponseContentEncryption: context.userinfoEncryptedResponseContentEncryption,
      // requestObjectSigningAlgorithm: context.requestObjectSigningAlgorithm,
      // requestObjectEncryptionKeyWrap: context.requestObjectEncryptionKeyWrap,
      // requestObjectEncryptionContentEncryption: context.requestObjectEncryptionContentEncryption,
      defaultMaxAge: context.defaultMaxAge,
      requireAuthTime: context.requireAuthTime,
      defaultAcrValues: context.defaultAcrValues,
      initiateLoginUri: context.initiateLoginUri?.toString() ?? null,
      // requestUris: context.requestUris,
      postLogoutRedirectUris:
        context.postLogoutRedirectUris?.map((postLogoutRedirectUri) => postLogoutRedirectUri.href) ?? null,
      backChannelLogoutUri: context.backChannelLogoutUri?.href ?? null,
      backChannelLogoutSessionRequired: context.backChannelLogoutSessionRequired,
      softwareId: context.softwareId,
      softwareVersion: context.softwareVersion,
    });

    this.clients[index] = client;
  }

  private secretToken(): string {
    let token = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

    for (let i = 0; i < 32; i++) {
      token += alphabet[randomInt(alphabet.length)];
    }

    return token;
  }
}
