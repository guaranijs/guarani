import argon2 from 'argon2';
import { validate } from 'class-validator';
import { Request, Response } from 'express';

import { CreateUserDto } from '../../dto/create-user.dto';
import { UserEntity } from '../../entities/user.entity';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    response.render('auth/register', { request, title: 'Register', csrf: request.csrfToken() });
  }

  public async post(request: Request, response: Response): Promise<void> {
    const createUserDto = Object.assign<CreateUserDto, CreateUserDto>(new CreateUserDto(), request.body);
    const errors = await validate(createUserDto);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => `Invalid field "${error.property}".`);

      return response.render('auth/register', {
        request,
        title: 'Register',
        csrf: request.body._csrf,
        errors: errorMessages,
      });
    }

    let user = await UserEntity.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    });

    if (user !== null) {
      return response.render('auth/register', { request, title: 'Register', error: 'User already registered.' });
    }

    user = new UserEntity();

    user.email = createUserDto.email;
    user.username = createUserDto.username;
    user.password = await argon2.hash(createUserDto.password, { type: argon2.argon2id });

    await user.save();

    return response.redirect('/auth/login');
  }
}

export const RegisterController = new Controller();
