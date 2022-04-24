import { UserService as BaseUserService } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import argon2 from 'argon2';

import { User } from '../entities/user.entity';

export class UserService implements BaseUserService {
  public async findUser(userId: string): Promise<Optional<User>> {
    return (await User.findOneBy({ id: userId })) ?? undefined;
  }

  public async authenticate(username: string, password: string): Promise<Optional<User>> {
    const user = await User.findOneBy({ username });

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
