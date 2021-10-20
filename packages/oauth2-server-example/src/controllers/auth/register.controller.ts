import { Request, Response } from 'express'
import { getRepository } from 'typeorm'

import { IUser, User } from '../../entities'

class Controller {
  public async registerForm(request: Request, response: Response) {
    const csrf = request.csrfToken()

    return response.render('auth/register', {
      request,
      title: 'Register',
      csrf
    })
  }

  public async register(request: Request, response: Response) {
    const data: IUser = request.body
    const userRepository = getRepository(User)

    if (await userRepository.findOne({ where: { email: data.email } })) {
      return response.render('auth/register', {
        request,
        title: 'Register',
        error: 'User already registered.'
      })
    }

    const user = userRepository.create({
      email: data.email,
      familyName: data.familyName,
      givenName: data.givenName,
      birthdate: data.birthdate,
      phoneNumber: data.phoneNumber
    })

    await user.setPassword(data.password)
    await userRepository.save(user)

    return response.redirect(303, '/auth/login')
  }
}

export const RegisterController = new Controller()
