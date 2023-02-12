import { Injectable } from '@guarani/di';

import { User } from '../../entities/user.entity';
import { UserServiceInterface } from '../user.service.interface';

@Injectable()
export class UserService implements UserServiceInterface {
  protected readonly users: User[] = [
    {
      id: '16907c32-687b-493c-85ba-f41f2c9d4daa',
      username: 'johndoe',
      password: 'secretpassword',
    },
  ];

  public constructor() {
    console.warn('Using default User Service. This is only recommended for development.');
  }

  public async findOne(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  public async findByResourceOwnerCredentials(username: string, password: string): Promise<User | null> {
    return this.users.find((user) => user.username === username && user.password === password) ?? null;
  }
}
