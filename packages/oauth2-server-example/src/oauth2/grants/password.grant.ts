import { Injectable } from '@guarani/ioc'
import { PasswordGrant as BasePasswordGrant } from '@guarani/oauth2'

import { User } from '../../entities'

@Injectable()
export class PasswordGrant extends BasePasswordGrant {
  protected async authenticate(
    username: string,
    password: string
  ): Promise<User> {
    const user = await User.findOne({ where: { email: username } })

    if (!user || !(await user.checkPassword(password))) {
      return null
    }

    return user
  }
}
