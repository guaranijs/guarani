import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response } from 'express';
import { parse as parseQs } from 'querystring';

import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

class Controller {
  public async index(request: Request, response: Response): Promise<void> {
    return response.render('profile/index', { request, title: 'Profile', success: request.flash('success') });
  }

  public async edit(request: Request, response: Response): Promise<void> {
    return response.render('profile/edit', {
      request,
      title: 'Profile',
      errors: request.flash('errors'),
      success: request.flash('success'),
    });
  }

  public async editProfile(request: Request, response: Response): Promise<void> {
    const parsedBody = parseQs(request.body.toString('utf8'));

    const user = request.user as User;

    try {
      const updateUserDto = plainToInstance(UpdateUserDto, parsedBody);
      const errors = await validate(updateUserDto, { skipMissingProperties: true });

      if (errors.length > 0) {
        request.flash('errors', errors.map((error) => Object.values(error.constraints ?? {})).flat());
        return response.redirect(303, '/profile/edit');
      }

      Object.assign(user, updateUserDto);

      await user.save();

      request.flash('success', 'Profile edited successfully');
      return response.redirect(303, '/profile/edit');
    } catch (exc: unknown) {
      request.flash('errors', 'There was an error saving the profile');
      return response.redirect(303, '/profile/edit');
    }
  }
}

export const ProfileController = new Controller();
