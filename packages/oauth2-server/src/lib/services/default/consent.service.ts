import { randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { Consent } from '../../entities/consent.entity';
import { User } from '../../entities/user.entity';
import { Logger } from '../../logger/logger';
import { ConsentServiceInterface } from '../consent.service.interface';

@Injectable()
export class ConsentService implements ConsentServiceInterface {
  protected readonly consents: Consent[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Consent Service. This is only recommended for development.`,
      '471552ac-e73f-4aca-bfbb-5aeda3c90821',
    );
  }

  public async create(scopes: string[], client: Client, user: User): Promise<Consent> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, '27e2efb8-c7c3-4431-b8b0-965c8eda248f', {
      scopes,
      client,
      user,
    });

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
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, '0ef187c3-98eb-495f-9178-5b745e33c035', {
      client,
      user,
    });

    return this.consents.find((consent) => consent.client.id === client.id && consent.user.id === user.id) ?? null;
  }

  public async save(consent: Consent): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called save()`, '61781e74-0b49-4664-92dd-61167fa2e984', { consent });

    const index = this.consents.findIndex((savedConsent) => savedConsent.id === consent.id);

    if (index > -1) {
      this.consents[index] = consent;
    }
  }

  public async remove(consent: Consent): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called remove()`, '11ef4074-bbf8-4e24-add9-355d28ca9b03', {
      consent,
    });

    const index = this.consents.findIndex((savedConsent) => savedConsent.id === consent.id);

    if (index > -1) {
      this.consents.splice(index, 1);
    }
  }
}
