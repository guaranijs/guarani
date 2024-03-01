import { randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Dictionary, Nullable } from '@guarani/types';

import { User } from '../../entities/user.entity';
import { UserinfoClaimsParameters } from '../../id-token/userinfo.claims.parameters';
import { Logger } from '../../logger/logger';
import { UserServiceInterface } from '../user.service.interface';

type SampleUser = User & UserinfoClaimsParameters;

@Injectable()
export class UserService implements UserServiceInterface {
  protected readonly users: SampleUser[] = [
    {
      id: '16907c32-687b-493c-85ba-f41f2c9d4daa',
      username: 'johndoe',
      password: 'secretpassword',
      name: 'John M. Doe',
      given_name: 'John',
      middle_name: 'Michael',
      family_name: 'Doe',
      nickname: 'j.doe',
      preferred_username: 'johndoe',
      profile: 'https://server.example.com/users/16907c32-687b-493c-85ba-f41f2c9d4daa/profile',
      picture: 'https://server.example.com/users/16907c32-687b-493c-85ba-f41f2c9d4daa/picture.jpg',
      website: 'https://server.example.com/users/16907c32-687b-493c-85ba-f41f2c9d4daa',
      email: 'john.doe@email.com',
      email_verified: true,
      gender: 'male',
      birthdate: '1996-03-14',
      zoneinfo: 'America/Los_Angeles',
      locale: 'en-US',
      phone_number: '+1 (425) 555-1212',
      phone_number_verified: true,
      address: {
        formatted: '123 Main Street, Los Angeles',
        street_address: '123 Main Street',
        locality: 'Los Angeles',
        region: 'California',
        postal_code: '90000',
        country: 'United States of America',
      },
      updated_at: Math.ceil(Date.now() / 1000),
    },
  ];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default User Service. This is only recommended for development.`,
      'e05ed4af-4a1c-400d-bee5-ab626c84cd97',
    );
  }

  public async create(parameters: Dictionary<any>): Promise<SampleUser> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, '0d932b5f-042b-4b12-970f-3286165b2f8e', {
      parameters,
    });

    const user: SampleUser = { id: randomUUID(), ...parameters };
    this.users.push(user);

    return user;
  }

  public async findOne(id: string): Promise<Nullable<SampleUser>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, 'ccec55bc-7cf6-431f-b319-2b567cc873e9', { id });
    return this.users.find((user) => user.id === id) ?? null;
  }

  public async findByResourceOwnerCredentials(username: string, password: string): Promise<Nullable<SampleUser>> {
    this.logger.debug(
      `[${this.constructor.name}] Called findByResourceOwnerCredentials()`,
      '438f011a-7ef7-44b4-bcbb-ad9835130f0a',
      { username, password },
    );

    return this.users.find((user) => user.username === username && user.password === password) ?? null;
  }

  public async getUserinfo(user: SampleUser, scopes: string[]): Promise<UserinfoClaimsParameters> {
    this.logger.debug(
      `[${this.constructor.name}] Called findByResourceOwnerCredentials()`,
      '772948cd-12c1-4a02-a1b9-df4d12f9b219',
      { user, scopes },
    );

    const claims: UserinfoClaimsParameters = {};

    if (scopes.includes('profile')) {
      claims.name = user.name;
      claims.given_name = user.given_name;
      claims.middle_name = user.middle_name;
      claims.family_name = user.family_name;
      claims.picture = user.picture;
      claims.gender = user.gender;
      claims.birthdate = user.birthdate;
      claims.updated_at = user.updated_at;
    }

    if (scopes.includes('email')) {
      claims.email = user.email;
      claims.email_verified = user.email_verified;
    }

    if (scopes.includes('phone')) {
      claims.phone_number = user.phone_number;
      claims.phone_number_verified = user.phone_number_verified;
    }

    if (scopes.includes('address') && user.address != null) {
      claims.address = {
        formatted: user.address.formatted,
        street_address: user.address.street_address,
        locality: user.address.locality,
        region: user.address.region,
        postal_code: user.address.postal_code,
        country: user.address.country,
      };
    }

    return claims;
  }
}
