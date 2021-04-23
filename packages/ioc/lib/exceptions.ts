import { InjectableToken, isConstructorToken } from './tokens'

/**
 * Base class for the Error of the Guarani IoC library.
 */
export class IoCError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class TokenNotRegistered extends IoCError {
  public constructor(token: InjectableToken<any>) {
    const tokenName = isConstructorToken(token) ? token.name : String(token)
    const message = `The token "${tokenName}" is not registered.`
    super(message)
  }
}
