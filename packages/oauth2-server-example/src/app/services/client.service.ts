import { Injectable } from '@guarani/di';
import { ClientServiceInterface } from '@guarani/oauth2-server';

import { Client } from '../entities/client.entity';

@Injectable()
export class ClientService implements ClientServiceInterface {
  public async findOne(id: string): Promise<Client | null> {
    return await Client.findOneBy({ id });
  }
}
