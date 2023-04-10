import { Injectable } from '@guarani/di';

import { randomUUID } from 'crypto';

import { Session } from '../../entities/session.entity';
import { User } from '../../entities/user.entity';
import { SessionServiceInterface } from '../session.service.interface';

@Injectable()
export class SessionService implements SessionServiceInterface {
  protected readonly sessions: Session[] = [];

  public constructor() {
    console.warn('Using default Session Service. This is only recommended for development.');
  }

  public async create(user: User, amr: string[] | undefined, acr: string | undefined): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      amr,
      acr,
      createdAt: new Date(),
      user,
    };

    this.sessions.push(session);

    return session;
  }

  public async findOne(id: string): Promise<Session | null> {
    return this.sessions.find((session) => session.id === id) ?? null;
  }

  public async save(session: Session): Promise<void> {
    const index = this.sessions.findIndex((savedSession) => savedSession.id === session.id);

    if (index > -1) {
      this.sessions[index] = session;
    }
  }

  public async remove(session: Session): Promise<void> {
    const index = this.sessions.findIndex((savedSession) => savedSession.id === session.id);

    if (index > -1) {
      this.sessions.splice(index, 1);
    }
  }
}
