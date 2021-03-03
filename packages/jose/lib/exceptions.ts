export class JoseError extends Error {
  public message: string

  constructor (message?: string) {
    super()

    this.name = this.constructor.name
    this.message = message || this.message
  }
}

export class InvalidKey extends JoseError {
  public message: string = 'The provided key is invalid or contains invalid parameters.'
}

export class UnsupportedAlgorithm extends JoseError {
  public message: string = 'The provided algorithm is currently not supported.'
}
