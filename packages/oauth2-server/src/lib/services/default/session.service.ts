import { randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Session } from '../../entities/session.entity';
import { Logger } from '../../logger/logger';
import { SessionServiceInterface } from '../session.service.interface';

@Injectable()
export class SessionService implements SessionServiceInterface {
  protected readonly sessions: Session[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Session Service. This is only recommended for development.`,
      '833b7f52-39d1-4d83-b7d4-b8d8e401c83a',
    );
  }

  public async create(): Promise<Session> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, '19874028-ca56-4ed8-b1f7-62ccd90a7144');

    const session: Session = { id: randomUUID(), activeLogin: null, logins: [] };
    this.sessions.push(session);

    return session;
  }

  public async findOne(id: string): Promise<Nullable<Session>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, 'd78414d8-8296-4c0c-b7ff-9cde91c9555f', { id });
    return this.sessions.find((session) => session.id === id) ?? null;
  }

  public async save(session: Session): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called save()`, '9203fe7c-281f-42f7-b079-3aae8cb7830f', { session });

    const index = this.sessions.findIndex((savedSession) => savedSession.id === session.id);

    if (index > -1) {
      this.sessions[index] = session;
    }
  }

  public async remove(session: Session): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called remove()`, 'bb35b0b6-1eeb-492a-a8c0-9b0ad71c1114', {
      session,
    });

    const index = this.sessions.findIndex((savedSession) => savedSession.id === session.id);

    if (index > -1) {
      this.sessions.splice(index, 1);
    }
  }
}
