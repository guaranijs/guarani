import { randomBytes, randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { Grant } from '../../entities/grant.entity';
import { Session } from '../../entities/session.entity';
import { Logger } from '../../logger/logger';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { GrantServiceInterface } from '../grant.service.interface';

@Injectable()
export class GrantService implements GrantServiceInterface {
  private readonly grants: Grant[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Grant Service. This is only recommended for development.`,
      '6947d91c-ab42-4850-a458-5249bf3d7654',
    );
  }

  public async create(parameters: AuthorizationRequest, client: Client, session: Session): Promise<Grant> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, 'a85c57c7-7dfe-4952-a68c-75e443b8e4e2', {
      parameters,
      client,
      session,
    });

    const grant: Grant = Object.assign<Grant, Partial<Grant>>(Reflect.construct(Grant, []), {
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
    });

    this.grants.push(grant);

    return grant;
  }

  public async findOne(id: string): Promise<Nullable<Grant>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, 'f92c1630-1f31-4e20-aee2-103a86ceae85', { id });
    return this.grants.find((grant) => grant.id === id) ?? null;
  }

  public async findOneByLoginChallenge(loginChallenge: string): Promise<Nullable<Grant>> {
    this.logger.debug(
      `[${this.constructor.name}] Called findOneByLoginChallenge()`,
      'ee8b0b42-2e8b-4f8a-b78e-e082b7ead6ae',
      { login_challenge: loginChallenge },
    );

    return this.grants.find((savedGrant) => savedGrant.loginChallenge === loginChallenge) ?? null;
  }

  public async findOneByConsentChallenge(consentChallenge: string): Promise<Nullable<Grant>> {
    this.logger.debug(
      `[${this.constructor.name}] Called findOneByConsentChallenge()`,
      '5928950d-386b-46b3-943c-e313dce823ff',
      { consent_challenge: consentChallenge },
    );

    return this.grants.find((savedGrant) => savedGrant.consentChallenge === consentChallenge) ?? null;
  }

  public async save(grant: Grant): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called save()`, 'b79c75e4-b4de-4176-b559-dcc8cb59e771', { grant });

    const index = this.grants.findIndex((savedGrant) => savedGrant.id === grant.id);

    if (index > -1) {
      this.grants[index] = grant;
    }
  }

  public async remove(grant: Grant): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called remove()`, '4a2bb790-6f45-4543-a605-2a0368c9ca68', { grant });

    const index = this.grants.findIndex((savedGrant) => savedGrant.id === grant.id);

    if (index > -1) {
      this.grants.splice(index, 1);
    }
  }
}
