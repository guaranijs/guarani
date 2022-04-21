import { UserService as BaseUserService } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import argon2 from 'argon2';

import { UserEntity } from '../entities/user.entity';

export class UserService implements BaseUserService {
  public async findUser(userId: string): Promise<Optional<UserEntity>> {
    return (await UserEntity.findOneBy({ id: userId })) ?? undefined;
  }

  public async authenticate(username: string, password: string): Promise<Optional<UserEntity>> {
    const user = await UserEntity.findOneBy({ username });

    if (user === null) {
      return undefined;
    }

    const passwordChecks = await argon2.verify(user.password, password, { type: argon2.argon2id });

    if (!passwordChecks) {
      return undefined;
    }

    return user;
  }
}
