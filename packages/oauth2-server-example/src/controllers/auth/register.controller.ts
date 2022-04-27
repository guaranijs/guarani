import bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import { User } from '../../entities/user.entity';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    return response.render('auth/register', { request, title: 'Register' });
  }

  public async post(request: Request, response: Response): Promise<void> {
    const { email, password } = request.body;

    const user = User.create({ email, password: await bcrypt.hash(password, 10) });

    await user.save();

    return response.redirect(303, '/auth/login');
  }
}

export const RegisterController = new Controller();
