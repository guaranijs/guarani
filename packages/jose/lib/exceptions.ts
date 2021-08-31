/**
 * Base error class for the exceptions of the JOSE implementation.
 */
export class JoseError extends Error {
  /**
   * Error message.
   */
  public readonly message: string

  /**
   * Instantiates a new JoseError and correctly sets the name of the Error.
   *
   * @param message Error message to be displayed.
   */
  constructor(message?: string) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Raised when the JSON Web Token is expired.
 */
export class ExpiredToken extends JoseError {
  public constructor(message = 'The provided JSON Web Token is expired.') {
    super(message)
  }
}

/**
 * Raised when the provided JOSE Header is invalid.
 */
export class InvalidJoseHeader extends JoseError {
  public constructor(message = 'The provided JOSE Header is invalid.') {
    super(message)
  }
}

/**
 * Raised when the provided JSON Web Encryption is invalid.
 */
export class InvalidJsonWebEncryption extends JoseError {
  public constructor(message = 'The provided JSON Web Encryption is invalid.') {
    super(message)
  }
}

/**
 * Raised when the provided JSON Web Signature is invalid.
 */
export class InvalidJsonWebSignature extends JoseError {
  public constructor(message = 'The provided JSON Web Signature is invalid.') {
    super(message)
  }
}

/**
 * Raised when the provided JSON Web Token is invalid.
 */
export class InvalidJsonWebToken extends JoseError {
  public constructor(message = 'The provided JSON Web Token is invalid.') {
    super(message)
  }
}

/**
 * Raised when the provided JSON Web Token Claim is invalid.
 */
export class InvalidJsonWebTokenClaim extends JoseError {
  public constructor(
    message = 'The provided JSON Web Token Claim is invalid.'
  ) {
    super(message)
  }
}

/**
 * Raised when the provided JWK is invalid.
 */
export class InvalidKey extends JoseError {
  public constructor(
    message = 'The provided key is invalid or contains invalid parameters.'
  ) {
    super(message)
  }
}

/**
 * Raised when the provided JWK Set is invalid.
 */
export class InvalidKeySet extends JoseError {
  public constructor(
    message = 'The provided key set is invalid or contain invalid keys.'
  ) {
    super(message)
  }
}

/**
 * Raised when the provided signature does not match the provided message.
 */
export class InvalidSignature extends JoseError {
  public constructor(
    message = 'The provided signature does not match the provided message.'
  ) {
    super(message)
  }
}

/**
 * Raised when the provided JSON Web Token is not valid yet.
 */
export class TokenNotValidYet extends JoseError {
  public constructor(
    message = 'The provided JSON Web Token is not valid yet.'
  ) {
    super(message)
  }
}

/**
 * Raised when the provided algorithm in not supported.
 */
export class UnsupportedAlgorithm extends JoseError {
  public constructor(
    message = 'The provided algorithm is currently not supported.'
  ) {
    super(message)
  }
}
