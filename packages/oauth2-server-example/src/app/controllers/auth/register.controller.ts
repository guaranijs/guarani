import argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response } from 'express';

import { UserRegistrationDto } from '../../dto/user-registration.dto';
import { User } from '../../entities/user.entity';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    return response.render('auth/register', { request, title: 'Register', errors: request.flash('errors') });
  }

  public async post(request: Request, response: Response): Promise<void> {
    const userRegistrationDto = plainToInstance(UserRegistrationDto, request.body);

    const errors = await validate(userRegistrationDto);

    if (errors.length > 0) {
      request.flash('errors', errors.map((error) => Object.values(error.constraints ?? {})).flat());
      return response.redirect(303, '/auth/register');
    }

    const user: User = Object.assign<User, Partial<User>>(new User(), {
      password: await argon2.hash(userRegistrationDto.password),
      givenName: userRegistrationDto.givenName,
      familyName: userRegistrationDto.familyName,
      email: userRegistrationDto.email,
      phoneNumber: userRegistrationDto.phoneNumber,
      birthdate: userRegistrationDto.birthdate,
      address: { formatted: userRegistrationDto.address },
    });

    await user.save();

    request.flash('success', 'User created successfully');

    return response.redirect(303, '/auth/login');
  }
}

export const RegisterController = new Controller();
