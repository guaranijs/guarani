import { Buffer } from 'buffer';
import { createHash, diffieHellman } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { EllipticCurve } from '../../../jwk/backends/elliptic-curve.type';
import { EllipticCurveKey } from '../../../jwk/backends/elliptic-curve/elliptic-curve.key';
import { OctetKeyPairKey } from '../../../jwk/backends/octet-key-pair/octet-key-pair.key';
import { OctetSequenceKey } from '../../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { AesBackend } from './aes.backend';
import { EcdhHeaderParameters } from './ecdh.header.parameters';
import { JsonWebEncryptionKeyWrapBackend } from './jsonwebencryption-keywrap.backend';
import { JSONWEBENCRYPTION_KEYWRAP_REGISTRY } from './jsonwebencryption-keywrap.registry';

/**
 * Implementation of the JSON Web Encryption ECDH-ES Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-4.6
 * @see https://www.rfc-editor.org/rfc/rfc8037.html#section-3.2
 */
class EcdhBackend extends JsonWebEncryptionKeyWrapBackend {
  /**
   * Elliptic Curves used by the JSON Web Encryption Key Wrap ECDH-ES Backend.
   */
  private readonly curves: Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'>[] = [
    'P-256',
    'P-384',
    'P-521',
    'X25519',
    'X448',
  ];

  /**
   * Instantiates a new JSON Web Encryption ECDH-ES Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Backend.
   */
  public constructor(protected override readonly algorithm: JsonWebEncryptionKeyWrapAlgorithm) {
    super(algorithm);
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param contentEncryptionBackend JSON Web Encryption Content Encryption Backend.
   * @param wrapKey JSON Web Key used to Wrap the provided Content Encryption Key.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   * @returns Generated Content Encryption Key, Wrapped Content Encryption Key and optional JSON Web Encryption Header.
   */
  public async wrap(
    contentEncryptionBackend: JsonWebEncryptionContentEncryptionBackend,
    wrapKey: EllipticCurveKey | OctetKeyPairKey,
    header: EcdhHeaderParameters
  ): Promise<[Buffer, Buffer, Partial<EcdhHeaderParameters>]> {
    this.validateJsonWebKey(wrapKey);

    const { alg, apu, apv, epk } = header;

    const ephemeralPublicKey = (await JsonWebKey.load(epk)) as EllipticCurveKey | OctetKeyPairKey;

    this.validateJsonWebKey(ephemeralPublicKey);

    if (wrapKey.kty !== ephemeralPublicKey.kty || wrapKey.crv !== ephemeralPublicKey.crv) {
      throw new InvalidJsonWebKeyException();
    }

    const sharedSecret = await this.deriveKey(contentEncryptionBackend, wrapKey, ephemeralPublicKey, header);

    const headerParameters: Partial<EcdhHeaderParameters> = { epk: ephemeralPublicKey.toJSON(), apu, apv };

    if (alg === 'ECDH-ES') {
      return [sharedSecret, Buffer.alloc(0), headerParameters];
    }

    const aesKeyWrapAlgorithm = alg.substring(8) as JsonWebEncryptionKeyWrapAlgorithm;
    const aesKeyWrapBackend = JSONWEBENCRYPTION_KEYWRAP_REGISTRY[aesKeyWrapAlgorithm] as AesBackend;

    const [contentEncryptionKey, wrappedKey] = await aesKeyWrapBackend.wrap(
      contentEncryptionBackend,
      new OctetSequenceKey({ kty: 'oct', k: sharedSecret.toString('base64url') })
    );

    return [contentEncryptionKey, wrappedKey, headerParameters];
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param contentEncryptionBackend JSON Web Encrytpion Content Encryption Backend.
   * @param unwrapKey JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param wrappedKey Wrapped Content Encryption Key.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(
    contentEncryptionBackend: JsonWebEncryptionContentEncryptionBackend,
    unwrapKey: EllipticCurveKey | OctetKeyPairKey,
    wrappedKey: Buffer,
    header: EcdhHeaderParameters
  ): Promise<Buffer> {
    this.validateJsonWebKey(unwrapKey);

    const { alg, epk } = header;

    const ephemeralPublicKey = (await JsonWebKey.load(epk)) as EllipticCurveKey | OctetKeyPairKey;

    this.validateJsonWebKey(ephemeralPublicKey);

    if (unwrapKey.kty !== ephemeralPublicKey.kty || unwrapKey.crv !== ephemeralPublicKey.crv) {
      throw new InvalidJsonWebKeyException();
    }

    const sharedSecret = await this.deriveKey(contentEncryptionBackend, unwrapKey, ephemeralPublicKey, header);

    if (alg === 'ECDH-ES') {
      return sharedSecret;
    }

    const aesKeyWrapAlgorithm = alg.substring(8) as JsonWebEncryptionKeyWrapAlgorithm;
    const aesKeyWrapBackend = JSONWEBENCRYPTION_KEYWRAP_REGISTRY[aesKeyWrapAlgorithm] as AesBackend;

    const unwrapJwk = new OctetSequenceKey({ kty: 'oct', k: sharedSecret.toString('base64url') });

    return await aesKeyWrapBackend.unwrap(contentEncryptionBackend, unwrapJwk, wrappedKey);
  }

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption Key Wrap Backend.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: EllipticCurveKey | OctetKeyPairKey): void {
    super.validateJsonWebKey(key);

    if (key.kty !== 'EC' && key.kty !== 'OKP') {
      throw new InvalidJsonWebKeyException(
        `The JSON Web Encryption Key Wrap Algorithm "${this.algorithm}" only accepts ["EC", "OKP"] JSON Web Keys.`
      );
    }

    if (!this.curves.includes(<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'>>key.crv)) {
      throw new InvalidJsonWebKeyException(
        `The JSON Web Encryption Key Wrap Algorithm "${this.algorithm}" ` +
          `only accepts the Elliptic Curves ["${this.curves.join('", "')}"].`
      );
    }
  }

  /**
   * Performs a Diffie-Hellman to obtain a Shared Secret and derives a Key using Concat KDF.
   *
   * @param contentEncryptionBackend JSON Web Encrytpion Content Encryption Backend.
   * @param key JSON Web Key used to Derive the Wrapped Content Encryption Key.
   * @param ephemeralPublicKey Ephemeral Public Key of the generator party.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   */
  private async deriveKey(
    contentEncryptionBackend: JsonWebEncryptionContentEncryptionBackend,
    key: EllipticCurveKey | OctetKeyPairKey,
    ephemeralPublicKey: EllipticCurveKey | OctetKeyPairKey,
    header: EcdhHeaderParameters
  ): Promise<Buffer> {
    const { alg, apu, apv, enc } = header;

    const keyLength = alg === 'ECDH-ES' ? contentEncryptionBackend.cekSize : Number.parseInt(alg.substring(9, 12), 10);

    const keyLengthBuffer = Buffer.alloc(4);
    keyLengthBuffer.writeUInt32BE(keyLength);

    const value = Buffer.concat([
      this.lengthAndInput(Buffer.from(alg === 'ECDH-ES' ? enc : alg, 'ascii')),
      this.lengthAndInput(typeof apu !== 'undefined' ? Buffer.from(apu, 'base64url') : Buffer.alloc(0)),
      this.lengthAndInput(typeof apv !== 'undefined' ? Buffer.from(apv, 'base64url') : Buffer.alloc(0)),
      keyLengthBuffer,
    ]);

    const sharedSecret = diffieHellman({ privateKey: key.cryptoKey, publicKey: ephemeralPublicKey.cryptoKey });

    return this.concatKdf(sharedSecret, keyLength, value);
  }

  /**
   * Returns a Buffer containing a 32-bit long length of the provided input followed by the input itself.
   *
   * @param input Input value to be formatted.
   */
  private lengthAndInput(input: Buffer): Buffer {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(input.length);

    return Buffer.concat([length, input]);
  }

  /**
   * Returns the result of the Concat KDF.
   */
  private concatKdf(secret: Buffer, bits: number, value: Buffer): Buffer {
    const iterations = Math.ceil((bits >> 3) / 32);
    const kdf = Buffer.alloc(iterations << 5);

    for (let iteration = 0; iteration < iterations; iteration++) {
      const data = Buffer.alloc(4 + secret.length + value.length);

      data.writeUInt32BE(iteration + 1);
      data.set(secret, 4);
      data.set(value, 4 + secret.length);

      kdf.set(createHash('sha256').update(data).digest(), iteration << 5);
    }

    return kdf.slice(0, bits >> 3);
  }
}

/**
 * ECDH-ES using Concat KDF.
 */
export const ECDH_ES = new EcdhBackend('ECDH-ES');

/**
 * ECDH-ES using Concat KDF and CEK wrapped with "A128KW" wrapping.
 */
export const ECDH_ES_A128KW = new EcdhBackend('ECDH-ES+A128KW');

/**
 * ECDH-ES using Concat KDF and CEK wrapped with "A192KW" wrapping.
 */
export const ECDH_ES_A192KW = new EcdhBackend('ECDH-ES+A192KW');

/**
 * ECDH-ES using Concat KDF and CEK wrapped with "A256KW" wrapping.
 */
export const ECDH_ES_A256KW = new EcdhBackend('ECDH-ES+A256KW');
