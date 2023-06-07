import { Injectable } from '@guarani/di';
import { SessionServiceInterface } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { Session } from '../entities/session.entity';

@Injectable()
export class SessionService implements SessionServiceInterface {
  public async create(): Promise<Session> {
    const session = Session.create();
    await session.save();
    return session;
  }

  public async findOne(id: string): Promise<Nullable<Session>> {
    return await Session.findOneBy({ id });
  }

  public async save(session: Session): Promise<void> {
    await session.save();
  }

  public async remove(session: Session): Promise<void> {
    await session.remove();
  }
}
