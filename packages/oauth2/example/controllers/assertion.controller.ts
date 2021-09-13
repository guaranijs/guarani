import { getContainer } from '@guarani/ioc'
import {
  JsonWebSignatureHeader,
  JsonWebToken,
  JsonWebTokenClaims,
  OctKey
} from '@guarani/jose'
import { secretToken } from '@guarani/utils'

import { Request, Response } from 'express'

import { Settings } from '../../lib/settings'
import { Client, User } from '../entities'

class Controller {
  public async get(request: Request, response: Response) {
    return response.render('jwt-assertion', {
      title: 'Generate JWT Assertions',
      csrf: request.csrfToken()
    })
  }

  public async post(request: Request, response: Response) {
    const [
      secretAssertion,
      privateAssertion,
      grant
    ] = await Controller.generateClientAssertions()

    const jwtAssertions = { secretAssertion, privateAssertion, grant }

    return response.render('jwt-assertion', {
      title: 'Generate JWT Assertions',
      csrf: request.csrfToken(),
      jwtAssertions
    })
  }

  private static async generateClientAssertions(): Promise<
    [string, string, string]
  > {
    const client = await Client.findOne('1619a65c-a4b4-4094-952f-c65ee1e7ad76')
    const user = await User.findOne()

    const secretHeader = new JsonWebSignatureHeader({ alg: 'HS256' })
    const privateHeader = new JsonWebSignatureHeader({ alg: 'ES256' })

    const iat = Math.floor(Date.now() / 1000)

    const clientAssertionClaims = new JsonWebTokenClaims({
      iss: client.id,
      sub: client.id,
      aud: getContainer('oauth2').resolve(Settings).issuer,
      iat,
      exp: iat + 3600,
      jti: secretToken(32)
    })

    const grantClaims = new JsonWebTokenClaims({
      iss: client.id,
      sub: user.id,
      aud: getContainer('oauth2').resolve(Settings).issuer,
      iat,
      exp: iat + 3600,
      jti: secretToken(32)
    })

    const secretJwt = new JsonWebToken(secretHeader, clientAssertionClaims)
    const privateJwt = new JsonWebToken(privateHeader, clientAssertionClaims)
    const grantJwt = new JsonWebToken(privateHeader, grantClaims)

    return [
      await secretJwt.sign(OctKey.parse(client.secret)),
      await privateJwt.sign(await client.getPublicKey()),
      await grantJwt.sign(await client.getPublicKey())
    ]
  }
}

export const AssertionController = new Controller()
