export class JoseError extends Error {
  public message: string

  constructor (message?: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class InvalidKey extends JoseError {
  public constructor (message = 'The provided key is invalid or contains invalid parameters.') {
    super(message)
  }
}

export class InvalidKeySet extends JoseError {
  public constructor (message = 'The provided key set is invalid or contain invalid keys.') {
    super(message)
  }
}

export class UnsupportedAlgorithm extends JoseError {
  public constructor (message = 'The provided algorithm is currently not supported.') {
    super(message)
  }
}
