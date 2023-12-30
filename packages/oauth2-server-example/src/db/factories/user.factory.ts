import bcrypt from 'bcrypt';

import { Faker, SexType } from '@faker-js/faker';
import { define } from '@paranode/typeorm-seeding';

import { User } from '../../app/entities/user.entity';

define(User, (faker: Faker): User => {
  const user = new User();

  const sex = <SexType>faker.name.sex();
  const firstName = faker.name.firstName(sex);
  const lastName = faker.name.lastName(sex);

  user.password = bcrypt.hashSync('Password@01', 10);
  user.givenName = firstName;
  user.middleName = faker.name.middleName(sex);
  user.familyName = lastName;
  user.picture = faker.image.avatar();
  user.email = faker.internet.email(firstName, lastName);
  user.gender = sex;
  user.birthdate = faker.date.birthdate().toISOString().substring(0, 10);
  user.phoneNumber = faker.phone.number();
  user.address = { formatted: faker.address.streetAddress(true) };

  return user;
});
