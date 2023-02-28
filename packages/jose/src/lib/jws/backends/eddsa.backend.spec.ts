import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { EllipticCurve } from '../../jwk/backends/elliptic-curve.type';
import { OctetKeyPairKey } from '../../jwk/backends/octet-key-pair/octet-key-pair.key';
import { OctetKeyPairKeyParameters } from '../../jwk/backends/octet-key-pair/octet-key-pair.key.parameters';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { EdDSA } from './eddsa.backend';

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature EdDSA Backend', () => {
  const ed25519PublicParameters: OctetKeyPairKeyParameters = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'g5p3LK1Mpb1lFnBDRlwvZPZSOnbGFSKnyngC7AOAsgE',
  };

  const ed25519PrivateParameters: OctetKeyPairKeyParameters = {
    ...ed25519PublicParameters,
    d: 'S52ag71xVm7aw2EQA2TWAJGsLKAecKVz2oJJVyK9FPA',
  };

  const ed448PublicParameters: OctetKeyPairKeyParameters = {
    kty: 'OKP',
    crv: 'Ed448',
    x: 'vAF7jwmYardxSMxwGvWOJxphwlfMfsiKfMPFuQLXLACFUHZFnlKEbsnh78QL3yipMt0eqUurfm8A',
  };

  const ed448PrivateParameters: OctetKeyPairKeyParameters = {
    ...ed448PublicParameters,
    d: 'E4Haa6qE2nRb4OKOQdLapdEuLVIW7iIi31-oIOzxRsa1lXxz8H0LsgPtdhaZfaiLVdlV2Qt83m22',
  };

  const ed25519PublicKey = new OctetKeyPairKey(ed25519PublicParameters);
  const ed25519PrivateKey = new OctetKeyPairKey(ed25519PrivateParameters);

  const ed448PublicKey = new OctetKeyPairKey(ed448PublicParameters);
  const ed448PrivateKey = new OctetKeyPairKey(ed448PrivateParameters);

  it('should have "EdDSA" as its algorithm.', () => {
    expect(EdDSA['algorithm']).toEqual<JsonWebSignatureAlgorithm>('EdDSA');
  });

  it('should have ["Ed25519", "Ed448"] as its "curve".', () => {
    expect(EdDSA['curves']).toEqual<EllipticCurve[]>(['Ed25519', 'Ed448']);
  });

  it('should throw when not using an "OKP" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetKeyPairKey.prototype);

    expect(() => EdDSA['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "EdDSA" only accepts "OKP" JSON Web Keys.')
    );
  });

  it('should throw when using a curve different than ["Ed25519", "Ed448"].', async () => {
    const key = await OctetKeyPairKey.generate('OKP', { curve: 'X25519' });

    expect(() => EdDSA['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Signature Algorithm "EdDSA" only accepts the Elliptic Curves ["Ed25519", "Ed448"].'
      )
    );
  });

  it('should throw when signing with an ed25519 public key.', async () => {
    await expect(EdDSA.sign(message, ed25519PublicKey)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when signing with an ed448 public key.', async () => {
    await expect(EdDSA.sign(message, ed448PublicKey)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature with an ed25519 key.', async () => {
    await expect(EdDSA.verify(Buffer.alloc(0), message, ed25519PublicKey)).rejects.toThrow(
      new InvalidJsonWebSignatureException()
    );
  });

  it('should throw when verifying a wrong signature with an ed448 key.', async () => {
    await expect(EdDSA.verify(Buffer.alloc(0), message, ed448PublicKey)).rejects.toThrow(
      new InvalidJsonWebSignatureException()
    );
  });

  it('should sign and verify a message with an ed25519 key pair.', async () => {
    let signature!: Buffer;

    await expect((async () => (signature = await EdDSA.sign(message, ed25519PrivateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(EdDSA.verify(signature, message, ed25519PublicKey)).resolves.not.toThrow();
  });

  it('should sign and verify a message with an ed448 key pair.', async () => {
    let signature!: Buffer;

    await expect((async () => (signature = await EdDSA.sign(message, ed448PrivateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(EdDSA.verify(signature, message, ed448PublicKey)).resolves.not.toThrow();
  });
});
