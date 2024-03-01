import { randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { Login } from '../../entities/login.entity';
import { Session } from '../../entities/session.entity';
import { User } from '../../entities/user.entity';
import { Logger } from '../../logger/logger';
import { LoginServiceInterface } from '../login.service.interface';

@Injectable()
export class LoginService implements LoginServiceInterface {
  protected readonly logins: Login[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Login Service. This is only recommended for development.`,
      '92793e17-1815-473f-adb4-ba57fdecd3bf',
    );
  }

  public async create(
    user: User,
    client: Client,
    session: Session,
    amr: Nullable<string[]>,
    acr: Nullable<string>,
  ): Promise<Login> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, '9c963787-b062-4b5f-ae3e-62b92e9c29bf', {
      user,
      client,
      session,
      amr,
      acr,
    });

    const login: Login = {
      id: randomUUID(),
      amr,
      acr,
      createdAt: new Date(),
      expiresAt: null,
      user,
      session,
      clients: [client],
    };

    this.logins.push(login);

    return login;
  }

  public async findOne(id: string): Promise<Nullable<Login>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, 'c0d2af44-3be0-4c53-b298-0f4e6943a7d1', { id });
    return this.logins.find((login) => login.id === id) ?? null;
  }

  public async findByUserId(id: string): Promise<Login[]> {
    this.logger.debug(`[${this.constructor.name}] Called findByUserId()`, 'c0608957-2f44-4a5e-a1db-30e8c95b0260', {
      id,
    });

    return this.logins.filter((login) => login.user.id === id);
  }

  public async save(login: Login): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called save()`, 'b9574cc2-b1af-481b-b74e-2ccc9b62a890', { login });

    const index = this.logins.findIndex((savedLogin) => savedLogin.id === login.id);

    if (index > -1) {
      this.logins[index] = login;
    }
  }

  public async remove(login: Login): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called remove()`, '9f770010-20d2-4144-979c-01d6d729a848', { login });

    const index = this.logins.findIndex((savedLogin) => savedLogin.id === login.id);

    if (index > -1) {
      this.logins.splice(index, 1);
    }
  }
}
