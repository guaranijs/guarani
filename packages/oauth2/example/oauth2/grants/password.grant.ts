import { Injectable } from '@guarani/ioc'

import { PasswordGrant as BasePasswordGrant } from '../../../lib/grants'
import { User } from '../../entities'

@Injectable()
// @ts-expect-error
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
