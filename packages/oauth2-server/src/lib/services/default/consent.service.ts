import { Injectable } from '@guarani/di';

import { randomBytes, randomUUID } from 'crypto';
import { Client } from '../../entities/client.entity';

import { Consent } from '../../entities/consent.entity';
import { User } from '../../entities/user.entity';
import { AuthorizationRequest } from '../../messages/authorization-request';
import { ConsentServiceInterface } from '../consent.service.interface';

@Injectable()
export class ConsentService implements ConsentServiceInterface {
  protected readonly consents: Consent[] = [];

  public constructor() {
    console.warn('Using default Consent Service. This is only recommended for development.');
  }

  public async create(
    parameters: AuthorizationRequest,
    loginChallenge: string,
    client: Client,
    user: User
  ): Promise<Consent> {
    const consent: Consent = {
      id: randomUUID(),
      scopes: [],
      loginChallenge,
      consentChallenge: randomBytes(16).toString('hex'),
      parameters,
      createdAt: new Date(),
      client,
      user,
    };

    this.consents.push(consent);

    return consent;
  }

  public async findOne(id: string): Promise<Consent | null> {
    return this.consents.find((consent) => consent.id === id) ?? null;
  }

  public async findOneByConsentChallenge(consentChallenge: string): Promise<Consent | null> {
    return this.consents.find((consent) => consent.consentChallenge === consentChallenge) ?? null;
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
