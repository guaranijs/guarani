import { Injectable } from '@guarani/di';

import { Client } from '../../entities/client.entity';
import { ClientServiceInterface } from '../client.service.interface';

@Injectable()
export class ClientService implements ClientServiceInterface {
  protected readonly clients: Client[] = [
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
        'urn:ietf:params:oauth:grant-type:jwt-bearer',
      ],
      applicationType: 'web',
      authenticationMethod: 'client_secret_basic',
      scopes: ['foo', 'bar', 'baz', 'qux'],
      createdAt: new Date(),
    },
  ];

  public constructor() {
    console.warn('Using default Client Service. This is only recommended for development.');
  }

  public async findOne(id: string): Promise<Client | null> {
    return this.clients.find((client) => client.id === id) ?? null;
  }
}
