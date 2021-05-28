import { Request, Response } from 'express'

import { Client } from '../entities'

class Controller {
  public async home(request: Request, response: Response) {
    const client = Client.create({
      id: '1619a65c-a4b4-4094-952f-c65ee1e7ad76',
      secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
      name: 'Guarani',
      grant_types: [
        'authorization_code',
        'client_credentials',
        'password',
        'refresh_token'
      ],
      redirect_uris: ['http://localhost:3333/callback'],
      response_types: [
        'code',
        'id_token',
        'token',
        'code id_token',
        'code token',
        'id_token token',
        'code id_token token'
      ],
      scopes: ['openid', 'profile', 'email', 'phone', 'address', 'api'],
      token_endpoint_auth_method: 'client_secret_basic'
    })

    await client.save()

    return response.render('home', { title: 'Home', user: request.user })
  }
}

export const HomeController = new Controller()
