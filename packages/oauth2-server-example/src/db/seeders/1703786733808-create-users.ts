import type { Factory, Seeder } from '@paranode/typeorm-seeding';

import { User } from '../../app/entities/user.entity';

export default class CreateUsers1703786733808 implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(User)().createMany(5);
  }
}
