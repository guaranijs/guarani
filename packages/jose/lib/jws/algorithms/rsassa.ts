import { KeyObject, sign, verify } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-json-web-key.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-json-web-signature.exception';
import { RsaPadding } from '../../jwk/algorithms/rsa/rsa-padding';
import { RsaKey } from '../../jwk/algorithms/rsa/rsa.key';
import { SupportedJsonWebSignatureAlgorithm } from './supported-jsonwebsignature-algorithm';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature.algorithm';

const signAsync = promisify(sign);
const verifyAsync = promisify(verify);

export class RsaSsaAlgorithm extends JsonWebSignatureAlgorithm {
  /**
   * RSA Padding used by the JSON Web Signature RSASSA Algorithm to Sign and Verify the Messages.
   */
  protected readonly padding: RsaPadding;

  /**
   * Instantiates a new JSON Web Signature RSASSA Algorithm to Sign and Verify the Messages.
   *
   * @param hash Hash Algorithm used to Sign and Verify the Messages.
   * @param algorithm Name of the JSON Web Signature Algorithm.
   * @param padding RSA Padding used by the JSON Web Signature RSASSA Algorithm to Sign and Verify the Messages.
   */
  public constructor(hash: string, algorithm: SupportedJsonWebSignatureAlgorithm, padding: RsaPadding) {
    super(hash, algorithm, 'RSA');

    this.padding = padding;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key: RsaKey): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const cryptoKey: KeyObject = Reflect.get(key, 'cryptoKey');

    if (cryptoKey.type !== 'private') {
      throw new InvalidJsonWebKeyException('A Private Key is needed to Sign a JSON Web Signature Message.');
    }

    const signature = await signAsync(this.hash, message, { key: cryptoKey, padding: this.padding });

    return signature;
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key: RsaKey): Promise<void> {
    this.validateJsonWebKey(key);

    const cryptoKey: KeyObject = Reflect.get(key, 'cryptoKey');

    const verificationResult = await verifyAsync(
      this.hash,
      message,
      { key: cryptoKey, padding: this.padding },
      signature
    );

    if (!verificationResult) {
      throw new InvalidJsonWebSignatureException();
    }
  }
}

/**
 * RSASSA-PKCS1-v1_5 using SHA-256.
 */
export const RS256 = new RsaSsaAlgorithm('SHA256', 'RS256', RsaPadding.PKCS1);

/**
 * RSASSA-PKCS1-v1_5 using SHA-384.
 */
export const RS384 = new RsaSsaAlgorithm('SHA384', 'RS384', RsaPadding.PKCS1);

/**
 * RSASSA-PKCS1-v1_5 using SHA-512.
 */
export const RS512 = new RsaSsaAlgorithm('SHA512', 'RS512', RsaPadding.PKCS1);

/**
 * RSASSA-PSS using SHA-256 and MGF1 with SHA-256.
 */
export const PS256 = new RsaSsaAlgorithm('SHA256', 'PS256', RsaPadding.PSS);

/**
 * RSASSA-PSS using SHA-384 and MGF1 with SHA-384.
 */
export const PS384 = new RsaSsaAlgorithm('SHA384', 'PS384', RsaPadding.PSS);

/**
 * RSASSA-PSS using SHA-512 and MGF1 with SHA-512.
 */
export const PS512 = new RsaSsaAlgorithm('SHA512', 'PS512', RsaPadding.PSS);
