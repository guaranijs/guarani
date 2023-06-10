import { randomBytes, randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { Grant } from '../../entities/grant.entity';
import { Session } from '../../entities/session.entity';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { GrantServiceInterface } from '../grant.service.interface';

@Injectable()
export class GrantService implements GrantServiceInterface {
  private readonly grants: Grant[] = [];

  public constructor() {
    console.warn('Using default Grant Service. This is only recommended for development.');
  }

  public async create(parameters: AuthorizationRequest, client: Client, session: Session): Promise<Grant> {
    const grant: Grant = {
      id: randomUUID(),
      loginChallenge: randomBytes(16).toString('hex'),
      consentChallenge: randomBytes(16).toString('hex'),
      parameters,
      interactions: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      client,
      session,
      consent: null,
    };

    this.grants.push(grant);

    return grant;
  }

  public async findOne(id: string): Promise<Nullable<Grant>> {
    return this.grants.find((grant) => grant.id === id) ?? null;
  }

  public async findOneByLoginChallenge(loginChallenge: string): Promise<Nullable<Grant>> {
    return this.grants.find((savedGrant) => savedGrant.loginChallenge === loginChallenge) ?? null;
  }

  public async findOneByConsentChallenge(consentChallenge: string): Promise<Nullable<Grant>> {
    return this.grants.find((savedGrant) => savedGrant.consentChallenge === consentChallenge) ?? null;
  }

  public async save(grant: Grant): Promise<void> {
    const index = this.grants.findIndex((savedGrant) => savedGrant.id === grant.id);

    if (index > -1) {
      this.grants[index] = grant;
    }
  }

  public async remove(grant: Grant): Promise<void> {
    const index = this.grants.findIndex((savedGrant) => savedGrant.id === grant.id);

    if (index > -1) {
      this.grants.splice(index, 1);
    }
  }
}
