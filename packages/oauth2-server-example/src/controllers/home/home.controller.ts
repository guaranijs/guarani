import {
  SupportedClientAuthentication,
  SupportedGrantType,
  SupportedResponseType
} from '@guarani/oauth2'

import { Request, Response } from 'express'
import { getRepository } from 'typeorm'

import { Client } from '../../entities'

class Controller {
  public async home(request: Request, response: Response) {
    const clientRepository = getRepository(Client)

    const client = clientRepository.create({
      id: '1619a65c-a4b4-4094-952f-c65ee1e7ad76',
      secret: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
      name: 'Guarani',
      grantTypes: [
        SupportedGrantType.AuthorizationCode,
        SupportedGrantType.ClientCredentials,
        SupportedGrantType.Implicit,
        SupportedGrantType.JwtBearer,
        SupportedGrantType.Password,
        SupportedGrantType.RefreshToken,
        SupportedGrantType.Saml2Bearer
      ],
      redirectUris: ['http://localhost:3333/callback'],
      responseTypes: [
        SupportedResponseType.Code,
        SupportedResponseType.CodeIdToken,
        SupportedResponseType.CodeIdTokenToken,
        SupportedResponseType.CodeToken,
        SupportedResponseType.IdToken,
        SupportedResponseType.IdTokenToken,
        SupportedResponseType.None,
        SupportedResponseType.Token
      ],
      scopes: ['openid', 'profile', 'email', 'phone', 'address'],
      authenticationMethod: SupportedClientAuthentication.ClientSecretBasic
    })

    await clientRepository.save(client)

    return response.render('home', { title: 'Home', user: request.user })
  }
}

export const HomeController = new Controller()
