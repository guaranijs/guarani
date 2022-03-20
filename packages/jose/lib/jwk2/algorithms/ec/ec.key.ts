import { Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { JsonWebKey } from '../../jsonwebkey';
import { JsonWebKeyParams } from '../../jsonwebkey.params';
import { ELLIPTIC_CURVES } from './_types';

/**
 * Representation of the parameters of an **Elliptic Curve** Asymmetric Key.
 */
export interface EcKeyParams extends JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty: 'EC';

  /**
   * Name of the elliptic curve.
   */
  readonly crv: string;

  /**
   * Base64Url representation of the X value.
   */
  readonly x: string;

  /**
   * Base64Url representation of the Y value.
   */
  readonly y: string;

  /**
   * Base64Url representation of the Private Value.
   */
  readonly d?: Optional<string>;
}

/**
 * Implementation of the **Elliptic Curve** Asymmetric Key.
 */
export class EcKey extends JsonWebKey implements EcKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty: 'EC' = 'EC';

  /**
   * Name of the elliptic curve.
   */
  public readonly crv!: string;

  /**
   * Base64Url representation of the X value.
   */
  public readonly x!: string;

  /**
   * Base64Url representation of the Y value.
   */
  public readonly y!: string;

  /**
   * Base64Url representation of the Private Value.
   */
  public readonly d?: Optional<string>;

  /**
   * Instantiantes a new Elliptic Curve Key based on the provided parameters.
   *
   * @param key Parameters of the key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: EcKeyParams, options: JsonWebKeyParams = {}) {
    const params = <EcKeyParams>{ ...key, ...options };

    if (params.kty !== undefined && params.kty !== 'EC') {
      throw new InvalidJsonWebKeyException(`Invalid ley parameter "kty". Expected "EC", got "${params.kty}".`);
    }

    const curve = ELLIPTIC_CURVES.find((ellipticCurve) => ellipticCurve.id === params.crv);

    if (curve === undefined) {
      throw new InvalidJsonWebKeyException(`Unsupported curve "${params.crv}".`);
    }

    if (typeof params.x !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "x".');
    }

    if (typeof params.y !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid key parameter "y".');
    }

    if (params.d !== undefined) {
      if (typeof params.d !== 'string') {
        throw new InvalidJsonWebKeyException('Invalid key parameter "d".');
      }
    }

    super(params);
  }

  /**
   * Checks if the key is an RSA Private Key.
   */
  public get isPrivateKey(): boolean {
    return this.d !== undefined;
  }

  /**
   * Returns a DER representation of the Public Key enveloped
   * in an X.509 SubjectPublicKeyInfo containing the Modulus
   * and the Public Exponent of the Key.
   *
   * @param key Defines the encoding of the Public Key.
   * @param format Format of the exported key.
   * @returns DER encoded SPKI Elliptic Curve Public Key.
   *
   * @example
   * ```
   * > const spki = key.export('public', 'der')
   * > spki
   * <Buffer 30 59 30 13 06 07 2a 86 48 ce 3d 02 01 06 08 ... 76 more bytes>
   * ```
   */
  // public export(key: 'public', format: 'der'): Buffer;

  /**
   * Returns a PEM representation of the Public Key enveloped
   * in an X.509 SubjectPublicKeyInfo containing the Modulus
   * and the Public Exponent of the Key.
   *
   * @param key Defines the encoding of the Public Key.
   * @param format Format of the exported key.
   * @returns PEM encoded SPKI Elliptic Curve Public Key.
   *
   * @example
   * ```
   * > const spki = key.export('public', 'pem')
   * > spki
   * '-----BEGIN PUBLIC KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END PUBLIC KEY-----\n'
   * ```
   */
  // public export(key: 'public', format: 'pem'): string;

  /**
   * Returns a DER representation of the Private Key
   * that only contains the parameters of the Key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns DER encoded SEC.1 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const sec1 = key.export('private', 'der', 'sec1')
   * > sec1
   * <Buffer 30 77 02 01 01 04 20 6f 05 57 e9 5c 7e 4c e7 ... 106 more bytes>
   * ```
   */
  // public export(key: 'private', format: 'der', type: 'sec1'): Buffer;

  /**
   * Returns a DER representation of the Private Key enveloped
   * in a PKCS#8 object containing all the parameters of the key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns DER encoded PKCS#8 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const pkcs8 = key.export('private', 'der', 'pkcs8')
   * > pkcs8
   * <Buffer 30 81 87 02 01 00 30 13 06 07 2a 86 48 ce 3d ... 123 more bytes>
   * ```
   */
  // public export(key: 'private', format: 'der', type: 'pkcs8'): Buffer;

  /**
   * Returns a PEM representation of the Private Key
   * that only contains the parameters of the Key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns PEM encoded SEC.1 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const sec1 = key.export('private', 'pem', 'sec1')
   * > sec1
   * '-----BEGIN EC PRIVATE KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END EC PRIVATE KEY-----\n'
   * ```
   */
  // public export(key: 'private', format: 'pem', type: 'sec1'): string;

  /**
   * Returns a PEM representation of the Private Key enveloped
   * in a PKCS#8 object containing all the parameters of the key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns PEM encoded PKCS#8 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const pkcs8 = key.export('private', 'pem', 'pkcs8')
   * > pkcs8
   * '-----BEGIN PRIVATE KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END PRIVATE KEY-----\n'
   * ```
   */
  // public export(key: 'private', format: 'pem', type: 'pkcs8'): string;

  // public export(key: 'public' | 'private', format: 'der' | 'pem', type?: 'sec1' | 'pkcs8'): Buffer | string {
  //   if (key !== 'public' && key !== 'private') {
  //     throw new TypeError('Invalid parameter "key".');
  //   }

  //   if (format !== 'der' && format !== 'pem') {
  //     throw new TypeError('Invalid parameter "format".');
  //   }

  //   if (key === 'private' && type !== 'sec1' && type !== 'pkcs8') {
  //     throw new TypeError('Invalid parameter "type".');
  //   }

  //   let root: Node, label: string;

  //   if (key === 'public') {
  //     root = encodePublicX509(this);
  //     label = 'PUBLIC KEY';
  //   }

  //   if (key === 'private') {
  //     if (type === 'sec1') {
  //       root = encodePrivateSec1(this);
  //       label = 'EC PRIVATE KEY';
  //     }

  //     if (type === 'pkcs8') {
  //       root = encodePrivatePkcs8(this);
  //       label = 'PRIVATE KEY';
  //     }
  //   }

  //   return format === 'der' ? DEREncoder(root!) : PEMEncoder(root!, label!);
  // }
}
