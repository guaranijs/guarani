import { Request, Response } from 'express'

import { IUser, User } from '../entities'

class Controller {
  public async form(request: Request, response: Response) {
    const csrf = request.csrfToken()

    return response.render('register', { request, title: 'Register', csrf })
  }

  public async register(request: Request, response: Response) {
    const data: IUser = request.body

    if (await User.findOne({ where: { email: data.email } }))
      return response.render('register', {
        request,
        title: 'Register',
        error: 'User already registered.'
      })

    const user = new User({
      email: data.email,
      familyName: data.familyName,
      givenName: data.givenName,
      address: data.address,
      birthdate: data.birthdate,
      middleName: data.middleName,
      phoneNumber: data.phoneNumber
    })

    await user.setPassword(data.password)
    await user.save()

    return response.redirect(303, '/auth/login')
  }
}

export const RegisterController = new Controller()
