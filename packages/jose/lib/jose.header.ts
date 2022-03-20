import { InvalidJoseHeaderException } from './exceptions';
import { JsonWebKeyParams } from './jwk';

/**
 * Defines the parameters supported by the JOSE Header.
 */
export interface JoseHeaderParams {
  /**
   * Algorithm of the header.
   */
  readonly alg: string;

  /**
   * URI of a Json Web Keyset.
   */
  readonly jku?: string;

  /**
   * JSON Web Key used by the header.
   */
  readonly jwk?: JsonWebKeyParams;

  /**
   * ID of the key used by the header.
   */
  readonly kid?: string;

  /**
   * URI of the X.509 certificate of the key.
   */
  readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the key.
   */
  readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  readonly 'x5t#S256'?: string;

  /**
   * Defines the type of the entire token.
   */
  readonly typ?: string;

  /**
   * Defines the type of the payload.
   */
  readonly cty?: string;

  /**
   * Defines the parameters that MUST be present in the header.
   */
  readonly crit?: string[];

  /**
   * Additional parameters.
   */
  readonly [parameter: string]: any;
}

/**
 * JOSE Protected and Unprotected Headers that compose the entire JOSE Header.
 */
export interface JoseProtectedAndUnprotectedHeaders {
  /**
   * JOSE Protected Header.
   */
  readonly protectedHeader?: Partial<JoseHeaderParams>;

  /**
   * JOSE Unprotected Header.
   */
  readonly unprotectedHeader?: Partial<JoseHeaderParams>;
}

/**
 * Base class representing the JOSE Header used by both the
 * **JSON Web Signature** and **JSON Web Encryption** implementations.
 */
export abstract class JoseHeader implements JoseHeaderParams {
  /**
   * Algorithm of the header.
   */
  public abstract readonly alg: string;

  /**
   * URI of a Json Web Keyset.
   */
  public readonly jku?: string;

  /**
   * JSON Web Key used by the header.
   */
  public readonly jwk?: JsonWebKeyParams;

  /**
   * ID of the key used by the header.
   */
  public readonly kid?: string;

  /**
   * URI of the X.509 certificate of the key.
   */
  public readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the key.
   */
  public readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  public readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  public readonly 'x5t#S256'?: string;

  /**
   * Defines the type of the entire token.
   */
  public readonly typ?: string;

  /**
   * Defines the type of the payload.
   */
  public readonly cty?: string;

  /**
   * Defines the parameters that MUST be present in the header.
   */
  public readonly crit?: string[];

  /**
   * Validates the parameters of the provided JOSE Header.
   *
   * @param header JOSE Header to be validated.
   */
  protected checkHeader(header: Partial<JoseHeaderParams>): void {
    if ('alg' in header && typeof header.alg !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "alg".');
    }

    if ('jku' in header) {
      throw new InvalidJoseHeaderException('Unsupported parameter "jku".');
    }

    if ('jwk' in header) {
      throw new InvalidJoseHeaderException('Unsupported parameter "jwk".');
    }

    if ('kid' in header && typeof header.kid !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "kid".');
    }

    if ('x5u' in header) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5u".');
    }

    if ('x5c' in header) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5c".');
    }

    if ('x5t' in header) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5t".');
    }

    if ('x5t#S256' in header) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5t#S256".');
    }

    if ('crit' in header) {
      if (!Array.isArray(header.crit) || header.crit.length === 0) {
        throw new InvalidJoseHeaderException('Invalid parameter "crit".');
      }

      if (header.crit.some((item) => typeof item !== 'string' || !item)) {
        throw new InvalidJoseHeaderException('Invalid parameter "crit".');
      }

      header.crit.forEach((item) => {
        if (!(item in header)) {
          throw new InvalidJoseHeaderException(`Missing required parameter "${item}".`);
        }
      });
    }
  }
}
