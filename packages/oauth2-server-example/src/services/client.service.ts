import { ClientService as BaseClientService } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import { ClientEntity } from '../entities/client.entity';

export class ClientService implements BaseClientService {
  public async findClient(clientId: string): Promise<Optional<ClientEntity>> {
    return (await ClientEntity.findOneBy({ id: clientId })) ?? undefined;
  }
}
