import { Injectable } from '@guarani/di';

import { randomUUID } from 'crypto';

import { Login } from '../../entities/login.entity';
import { Session } from '../../entities/session.entity';
import { User } from '../../entities/user.entity';
import { LoginServiceInterface } from '../login.service.interface';

@Injectable()
export class LoginService implements LoginServiceInterface {
  protected readonly logins: Login[] = [];

  public constructor() {
    console.warn('Using default Login Service. This is only recommended for development.');
  }

  public async create(
    user: User,
    session: Session,
    amr: string[] | undefined,
    acr: string | undefined
  ): Promise<Login> {
    const login: Login = {
      id: randomUUID(),
      amr,
      acr,
      createdAt: new Date(),
      user,
      session,
    };

    this.logins.push(login);

    return login;
  }

  public async findOne(id: string): Promise<Login | null> {
    return this.logins.find((login) => login.id === id) ?? null;
  }

  public async remove(login: Login): Promise<void> {
    const index = this.logins.findIndex((savedSession) => savedSession.id === login.id);

    if (index > -1) {
      this.logins.splice(index, 1);
    }
  }
}
