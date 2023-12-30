import { randomBytes, randomInt, randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { PostRegistrationContext } from '../../context/registration/post.registration-context';
import { PutRegistrationContext } from '../../context/registration/put.registration-context';
import { Client } from '../../entities/client.entity';
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

  public constructor() {
    console.warn('Using default Client Service. This is only recommended for development.');
  }

  public async create(context: PostRegistrationContext): Promise<Client> {
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
    return this.clients.find((client) => client.id === id) ?? null;
  }

  public async remove(client: Client): Promise<void> {
    const index = this.clients.findIndex((registeredClient) => registeredClient.id === client.id);

    if (index > -1) {
      this.clients.splice(index, 1);
    }
  }

  public async update(client: Client, context: PutRegistrationContext): Promise<void> {
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
