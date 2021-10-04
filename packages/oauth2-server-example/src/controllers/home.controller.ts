import { Request, Response } from 'express'

// import { Client } from '../entities'

class Controller {
  public async home(request: Request, response: Response) {
    // const client = new Client({
    //   id: '1619a65c-a4b4-4094-952f-c65ee1e7ad76',
    //   secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
    //   name: 'Guarani',
    //   grantTypes: [
    //     'authorization_code',
    //     'client_credentials',
    //     'implicit',
    //     'password',
    //     'refresh_token',
    //     'urn:ietf:params:oauth:grant-type:jwt-bearer',
    //     'urn:ietf:params:oauth:grant-type:saml2-bearer'
    //   ],
    //   redirectUris: ['http://localhost:3333/callback'],
    //   responseTypes: [
    //     'code',
    //     'id_token',
    //     'none',
    //     'token',
    //     'code id_token',
    //     'code token',
    //     'id_token token',
    //     'code id_token token'
    //   ],
    //   scopes: ['openid', 'profile', 'email', 'phone', 'address'],
    //   authenticationMethod: 'client_secret_basic'
    // })

    // await client.save()

    return response.render('home', { title: 'Home', user: request.user })
  }
}

export const HomeController = new Controller()
