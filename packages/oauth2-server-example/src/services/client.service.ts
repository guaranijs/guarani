import { ClientService as BaseClientService } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import { Client } from '../entities/client.entity';

export class ClientService implements BaseClientService {
  public async findClient(clientId: string): Promise<Optional<Client>> {
    return (await Client.findOneBy({ id: clientId })) ?? undefined;
  }
}
