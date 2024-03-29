import { randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { Consent } from '../../entities/consent.entity';
import { User } from '../../entities/user.entity';
import { ConsentServiceInterface } from '../consent.service.interface';

@Injectable()
export class ConsentService implements ConsentServiceInterface {
  protected readonly consents: Consent[] = [];

  public constructor() {
    console.warn('Using default Consent Service. This is only recommended for development.');
  }

  public async create(scopes: string[], client: Client, user: User): Promise<Consent> {
    const consent: Consent = {
      id: randomUUID(),
      scopes,
      createdAt: new Date(),
      expiresAt: null,
      client,
      user,
    };

    this.consents.push(consent);

    return consent;
  }

  public async findOne(client: Client, user: User): Promise<Nullable<Consent>> {
    return this.consents.find((consent) => consent.client.id === client.id && consent.user.id === user.id) ?? null;
  }

  public async save(consent: Consent): Promise<void> {
    const index = this.consents.findIndex((savedConsent) => savedConsent.id === consent.id);

    if (index > -1) {
      this.consents[index] = consent;
    }
  }

  public async remove(consent: Consent): Promise<void> {
    const index = this.consents.findIndex((savedConsent) => savedConsent.id === consent.id);

    if (index > -1) {
      this.consents.splice(index, 1);
    }
  }
}
