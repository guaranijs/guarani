import { constants, sign, verify } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

const signAsync = promisify(sign);
const verifyAsync = promisify(verify);

/**
 * Implementation of the JSON Web Signature RSASSA Backend.
 */
class RsaSsaBackend extends JsonWebSignatureBackend {
  /**
   * RSA Padding used by the JSON Web Signature RSASSA Backend to Sign and Verify Messages.
   */
  protected readonly padding: number;

  /**
   * Instantiates a new JSON Web Signature RSASSA Backend to Sign and Verify Messages.
   *
   * @param algorithm Name of the JSON Web Signature Backend.
   * @param hash Hash Algorithm used to Sign and Verify Messages.
   * @param padding RSA Padding used by the JSON Web Signature RSASSA Backend to Sign and Verify Messages.
   */
  public constructor(algorithm: JsonWebSignatureAlgorithm, hash: string, padding: number) {
    super(algorithm, hash, 'RSA');

    this.padding = padding;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: JsonWebKey): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const { cryptoKey } = key;

    if (cryptoKey.type !== 'private') {
      throw new InvalidJsonWebKeyException('A Private Key is needed to Sign a JSON Web Signature Message.');
    }

    return await signAsync(this.hash, message, { key: cryptoKey, padding: this.padding });
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key: JsonWebKey): Promise<void> {
    this.validateJsonWebKey(key);

    const result = await verifyAsync(this.hash, message, { key: key.cryptoKey, padding: this.padding }, signature);

    if (!result) {
      throw new InvalidJsonWebSignatureException();
    }
  }
}

/**
 * RSASSA-PKCS1-v1_5 using SHA-256.
 */
export const RS256 = new RsaSsaBackend('RS256', 'SHA256', constants.RSA_PKCS1_PADDING);

/**
 * RSASSA-PKCS1-v1_5 using SHA-384.
 */
export const RS384 = new RsaSsaBackend('RS384', 'SHA384', constants.RSA_PKCS1_PADDING);

/**
 * RSASSA-PKCS1-v1_5 using SHA-512.
 */
export const RS512 = new RsaSsaBackend('RS512', 'SHA512', constants.RSA_PKCS1_PADDING);

/**
 * RSASSA-PSS using SHA-256 and MGF1 with SHA-256.
 */
export const PS256 = new RsaSsaBackend('PS256', 'SHA256', constants.RSA_PKCS1_PSS_PADDING);

/**
 * RSASSA-PSS using SHA-384 and MGF1 with SHA-384.
 */
export const PS384 = new RsaSsaBackend('PS384', 'SHA384', constants.RSA_PKCS1_PSS_PADDING);

/**
 * RSASSA-PSS using SHA-512 and MGF1 with SHA-512.
 */
export const PS512 = new RsaSsaBackend('PS512', 'SHA512', constants.RSA_PKCS1_PSS_PADDING);
