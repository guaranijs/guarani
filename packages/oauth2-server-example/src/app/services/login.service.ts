import { Injectable } from '@guarani/di';
import { LoginServiceInterface } from '@guarani/oauth2-server';

import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class LoginService implements LoginServiceInterface {
  public async create(
    user: User,
    session: Session,
    amr: string[] | undefined,
    acr: string | undefined
  ): Promise<Login> {
    const login = Login.create({ amr, acr, user, session });
    await login.save();
    return login;
  }

  public async findOne(id: string): Promise<Login | null> {
    return await Login.findOneBy({ id });
  }

  public async remove(login: Login): Promise<void> {
    await login.remove();
  }
}
