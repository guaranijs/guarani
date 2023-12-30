import type { Factory, Seeder } from '@paranode/typeorm-seeding';

import { Client } from '../../app/entities/client.entity';

export default class CreateClients1703786796237 implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(Client)().create();
  }
}
