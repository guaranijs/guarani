import { Injectable } from '@guarani/di';
import { ConsentServiceInterface } from '@guarani/oauth2-server';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ConsentService implements ConsentServiceInterface {
  public async create(scopes: string[], client: Client, user: User): Promise<Consent> {
    const consent = Consent.create({ scopes, client, user });
    await consent.save();
    return consent;
  }

  public async findOne(id: string): Promise<Consent | null> {
    return await Consent.findOneBy({ id });
  }

  public async save(consent: Consent): Promise<void> {
    await consent.save();
  }

  public async remove(consent: Consent): Promise<void> {
    await consent.remove();
  }
}
