import argon2 from 'argon2';

import { Injectable } from '@guarani/di';
import { UserinfoClaimsParameters, UserServiceInterface } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { UserRegistrationDto } from '../dto/user-registration.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService implements UserServiceInterface {
  public async create(parameters: UserRegistrationDto): Promise<User> {
    const user = User.create({
      password: await argon2.hash(parameters.password, { type: argon2.argon2id }),
      givenName: parameters.given_name,
      familyName: parameters.family_name,
      email: parameters.email,
      phoneNumber: parameters.phone_number,
      birthdate: parameters.birthdate,
      address: { formatted: parameters.address },
    });

    await user.save();

    return user;
  }

  public async findOne(id: string): Promise<Nullable<User>> {
    return await User.findOneBy({ id });
  }

  public async findByResourceOwnerCredentials(username: string, password: string): Promise<Nullable<User>> {
    const user = await User.findOneBy({ email: username });

    if (user === null) {
      return null;
    }

    if (!(await argon2.verify(user.password, password, { type: argon2.argon2id }))) {
      return null;
    }

    return user;
  }

  public async getUserinfo(user: User, scopes: string[]): Promise<UserinfoClaimsParameters> {
    const claims: UserinfoClaimsParameters = { sub: user.id };

    if (scopes.includes('profile')) {
      claims.given_name = user.givenName;
      claims.middle_name = user.middleName ?? undefined;
      claims.family_name = user.familyName;
      claims.picture = user.picture ?? undefined;
      claims.gender = user.gender ?? undefined;
      claims.birthdate = user.birthdate;
      claims.updated_at = Math.ceil(user.updatedAt.getTime() / 1000);
    }

    if (scopes.includes('email')) {
      claims.email = user.email;
      claims.email_verified = user.emailVerified;
    }

    if (scopes.includes('phone')) {
      claims.phone_number = user.phoneNumber;
      claims.phone_number_verified = user.phoneNumberVerified;
    }

    if (scopes.includes('address')) {
      claims.address = { formatted: user.address.formatted };
    }

    return claims;
  }
}
