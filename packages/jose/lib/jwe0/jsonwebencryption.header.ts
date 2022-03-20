import { removeNullishValues } from '@guarani/objects';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { JoseHeader, JoseHeaderParams } from '../jose.header';
import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';
import { JWE_ALGORITHMS, SupportedJWEAlgorithm } from './algorithms/alg/jwe-algorithms';
import { JWE_ENCRYPTIONS, SupportedJWEEncryption } from './algorithms/enc/jwe-encryptions';
import { JWE_COMPRESSIONS, SupportedJWECompression } from './algorithms/zip/jwe-compressions';

/**
 * Defines the parameters supported by the JWE JOSE Header.
 */
export interface JWEHeaderParams extends JoseHeaderParams {
  /**
   * JWE CEK Algorithm used to encrypt and decrypt the Content Encryption Key.
   */
  readonly alg: SupportedJWEAlgorithm;

  /**
   * JWE Authenticated Algorithm used to encrypt and decrypt the Plaintext.
   */
  readonly enc: SupportedJWEEncryption;

  /**
   * Compression algorithm of the JSON Web Encryption.
   */
  readonly zip?: SupportedJWECompression;

  /**
   * URI of a JWK Set that contains the key used to encrypt the token.
   */
  readonly jku?: string;

  /**
   * JSON Web Key used to encrypt the token.
   */
  readonly jwk?: JsonWebKeyParams<any>;

  /**
   * ID of the key used to encrypt the token.
   */
  readonly kid?: string;

  /**
   * URI of the X.509 certificate of the key used to encrypt the token.
   */
  readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the key used to encrypt the token.
   */
  readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
   */
  readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
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
}

/**
 * Implementation of RFC 7516.
 *
 * This is the implementation of the Header of the Json Web Encryption.
 * It provides validation for the default parameters of the JOSE header.
 *
 * The JOSE Header is a JSON object that provides information on how to
 * manipulate the plaintext of the message, such as permitted algorithms
 * and the keys to be used in encrypting and decrypting the plaintext.
 */
export class JsonWebEncryptionHeader extends JoseHeader implements JWEHeaderParams {
  /**
   * JWE CEK Algorithm used to encrypt and decrypt the Content Encryption Key.
   */
  public readonly alg!: SupportedJWEAlgorithm;

  /**
   * JWE Authenticated Algorithm used to encrypt and decrypt the Plaintext.
   */
  public readonly enc!: SupportedJWEEncryption;

  /**
   * Compression algorithm of the JSON Web Encryption.
   */
  public readonly zip?: SupportedJWECompression;

  /**
   * URI of a JWK Set that contains the key used to encrypt the token.
   */
  public readonly jku?: string;

  /**
   * JSON Web Key used to encrypt the token.
   */
  public readonly jwk?: JsonWebKeyParams<any>;

  /**
   * ID of the key used to encrypt the token.
   */
  public readonly kid?: string;

  /**
   * URI of the X.509 certificate of the key used to encrypt the token.
   */
  public readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the key used to encrypt the token.
   */
  public readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
   */
  public readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
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
   * Returns the provided JWE JOSE Header unmodified.
   *
   * @param header Instance of a JsonWebEncryptionHeader
   */
  public constructor(header: JsonWebEncryptionHeader);

  /**
   * Instantiates a new JWE JOSE Header for JWE Compact Serialization.
   *
   * @param header Parameters of the JWE JOSE Header.
   */
  public constructor(header: JWEHeaderParams);

  public constructor(header: JsonWebEncryptionHeader | JWEHeaderParams) {
    super();

    if (header instanceof JsonWebEncryptionHeader) {
      return header;
    }

    if (header.alg == null) {
      throw new InvalidJoseHeaderException('Missing required parameter "alg".');
    }

    if (header.enc == null) {
      throw new InvalidJoseHeaderException('Missing required parameter "enc".');
    }

    this.checkHeader(header);

    Object.assign(this, removeNullishValues(header));
  }

  /**
   * Validates the parameters of the provided JWE JOSE Header.
   *
   * @param header JWE JOSE Header to be validated.
   */
  protected checkHeader(header: Partial<JWEHeaderParams>): void {
    if ('enc' in header && typeof header.enc !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "enc".');
    }

    if ('zip' in header && typeof header.zip !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "zip".');
    }

    super.checkHeader(header);

    if (header.alg != null && !(header.alg in JWE_ALGORITHMS)) {
      throw new InvalidJoseHeaderException('Invalid JSON Web Encryption Key Wrapping Algorithm.');
    }

    if (header.enc != null && !(header.enc in JWE_ENCRYPTIONS)) {
      throw new InvalidJoseHeaderException('Invalid JSON Web Encryption Content Encryption Algorithm.');
    }

    if (header.zip != null && !(header.zip in JWE_COMPRESSIONS)) {
      throw new InvalidJoseHeaderException('Invalid JSON Web Encryption Plaintext Compression Algorithm.');
    }
  }
}
