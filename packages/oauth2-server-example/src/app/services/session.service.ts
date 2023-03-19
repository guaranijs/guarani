import { Injectable } from '@guarani/di';
import { SessionServiceInterface } from '@guarani/oauth2-server';

import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SessionService implements SessionServiceInterface {
  public async create(user: User): Promise<Session> {
    const session = Session.create({ user });
    await session.save();
    return session;
  }

  public async findOne(id: string): Promise<Session | null> {
    return await Session.findOneBy({ id });
  }

  public async save(session: Session): Promise<void> {
    await session.save();
  }

  public async remove(session: Session): Promise<void> {
    await session.remove();
  }
}
