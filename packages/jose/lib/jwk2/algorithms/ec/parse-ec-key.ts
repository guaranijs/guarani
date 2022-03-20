import { DerDecoder } from '@guarani/asn1';
import { encode } from '@guarani/base64url';
import { binaryToBuffer } from '@guarani/primitives';
import { Optional } from '@guarani/types';
import { fromPEM } from '@guarani/utils';
import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';

import { JsonWebKeyParams } from '../../jsonwebkey';
import { EcKey } from './ec.key';
import { ECPublicSPKI } from './model/ec-public-spki';
import { createECPublicSPKIParameters } from './model/ec-public-spki-parameters';
import { ELLIPTIC_CURVES } from './_types';

/**
 * Parses a PEM encoded Elliptic Curve Key.
 *
 * @param pem PEM representation of the Elliptic Curve Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an EcKey.
 */
export function parseEcKey(pem: string, options?: Optional<JsonWebKeyParams>): EcKey;

/**
 * Parses a DER encoded Elliptic Curve Key.
 *
 * @param der DER representation of the Elliptic Curve Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an EcKey.
 */
export function parseEcKey(der: Buffer, options?: Optional<JsonWebKeyParams>): EcKey;

export function parseEcKey(data: string | Buffer, options?: Optional<JsonWebKeyParams>): EcKey {
  if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
    throw new TypeError('Invalid Key Data.');
  }

  const decoder = new DerDecoder(Buffer.isBuffer(data) ? data : fromPEM(data), ECPublicSPKI);
  const spki = decoder.decode();

  const curve = ELLIPTIC_CURVES.find((ellipticCurve) => ellipticCurve.oid === spki.oid.curveOid);

  if (curve === undefined) {
    throw new InvalidJsonWebKeyException();
  }

  const publicKeyDecoder = new DerDecoder(binaryToBuffer(spki.publicKey), createECPublicSPKIParameters(curve.length));
  const publicKey = publicKeyDecoder.decode();

  return new EcKey({ crv: curve.id, x: encode(publicKey.x), y: encode(publicKey.y) }, options);
}
