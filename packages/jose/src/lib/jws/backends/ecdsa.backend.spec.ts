import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { EllipticCurve } from '../../jwk/backends/elliptic-curve.type';
import { EllipticCurveKey } from '../../jwk/backends/elliptic-curve/elliptic-curve.key';
import { EllipticCurveKeyParameters } from '../../jwk/backends/elliptic-curve/elliptic-curve.key.parameters';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { ES256, ES384, ES512 } from './ecdsa.backend';

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature ECDSA using P-256 and SHA-256 Backend', () => {
  const publicParameters: EllipticCurveKeyParameters = {
    kty: 'EC',
    crv: 'P-256',
    x: 'n8MBkJ0EfDC91TF_B2j1yLOEJ8JS2w-vBc5MsjNiIHg',
    y: 'NbGNGGRtO5YuiLrYvbS-vajMPAuqT-sfmpmNcCNxElg',
  };

  const privateParameters: EllipticCurveKeyParameters = {
    ...publicParameters,
    d: 'YyUqj9enPBrlUtK1rf9ycAU9OUUYNlh7Fir0x8hlWX0',
  };

  const publicKey = new EllipticCurveKey(publicParameters);
  const privateKey = new EllipticCurveKey(privateParameters);

  it('should have "ES256" as its algorithm.', () => {
    expect(ES256['algorithm']).toEqual<JsonWebSignatureAlgorithm>('ES256');
  });

  it('should have "SHA256" as its "hash".', () => {
    expect(ES256['hash']).toEqual('SHA256');
  });

  it('should have "P-256" as its "curve".', () => {
    expect(ES256['curve']).toEqual<EllipticCurve>('P-256');
  });

  it('should throw when not using an "EC" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, EllipticCurveKey.prototype);

    expect(() => ES256['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "ES256" only accepts "EC" JSON Web Keys.')
    );
  });

  it('should throw when using a curve different than "P-256".', async () => {
    const key = await EllipticCurveKey.generate('EC', { curve: 'P-384' });

    expect(() => ES256['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Signature Algorithm "ES256" only accepts the Elliptic Curve "P-256".'
      )
    );
  });

  it('should throw when signing with a public key.', async () => {
    await expect(ES256.sign(message, publicKey)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    await expect(ES256.verify(Buffer.alloc(0), message, publicKey)).rejects.toThrow(
      new InvalidJsonWebSignatureException()
    );
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    await expect((async () => (signature = await ES256.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(ES256.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature ECDSA using P-384 and SHA-384 Backend', () => {
  const publicParameters: EllipticCurveKeyParameters = {
    kty: 'EC',
    crv: 'P-384',
    x: 'WQHUcjVyE63vMl-SJNYYmqgYkJKkNGOctFcD368nyI2DogjP-34teV5KUZo82AxT',
    y: 'T4hHQx5WkQxjInUkQ1mMBu9iOw_ICOC5wh8QP79BRi-UPYfMP0z7b-LODdijwwFb',
  };

  const privateParameters: EllipticCurveKeyParameters = {
    ...publicParameters,
    d: 'Sp2paYMyI8y4oWP7GfQXaSyaoFjyd-9IvqnQlAWAdYg_z-45Q809-_kgR47c15X2',
  };

  const publicKey = new EllipticCurveKey(publicParameters);
  const privateKey = new EllipticCurveKey(privateParameters);

  it('should have "ES384" as its algorithm.', () => {
    expect(ES384['algorithm']).toEqual<JsonWebSignatureAlgorithm>('ES384');
  });

  it('should have "SHA384" as its "hash".', () => {
    expect(ES384['hash']).toEqual('SHA384');
  });

  it('should have "P-384" as its "curve".', () => {
    expect(ES384['curve']).toEqual<EllipticCurve>('P-384');
  });

  it('should throw when not using an "EC" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, EllipticCurveKey.prototype);

    expect(() => ES384['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "ES384" only accepts "EC" JSON Web Keys.')
    );
  });

  it('should throw when using a curve different than "P-384".', async () => {
    const key = await EllipticCurveKey.generate('EC', { curve: 'P-521' });

    expect(() => ES384['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Signature Algorithm "ES384" only accepts the Elliptic Curve "P-384".'
      )
    );
  });

  it('should throw when signing with a public key.', async () => {
    await expect(ES384.sign(message, publicKey)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    await expect(ES384.verify(Buffer.alloc(0), message, publicKey)).rejects.toThrow(
      new InvalidJsonWebSignatureException()
    );
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    await expect((async () => (signature = await ES384.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(ES384.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature ECDSA using P-521 and SHA-512 Backend', () => {
  const publicParameters: EllipticCurveKeyParameters = {
    kty: 'EC',
    crv: 'P-521',
    x: 'AcQkwaU8dBVZygHPgR7uukQGwy1SHMbM3bkXWnC3gDm6I_OW5RQgadCWSbZ1e2wV4fZWw1YaspSU8qwmZ1_jKDNt',
    y: 'ADU7z6Rqkp2EJRzcNPw_-EmKyLS79zNoGyFVFNR0WTjmUopRk6xEZz6wW_ELgllOuTEuAkneRupjGNgObgpJJxNN',
  };

  const privateParameters: EllipticCurveKeyParameters = {
    ...publicParameters,
    d: 'AdTlQfG5YXpKKdb8ryx4k4Wn-MQN8KgPdfMkOFEs56c5phlEXPnu7nsOszCzkWQ5V9cL7GvDo5KSgDg0P8eYhfv4',
  };

  const publicKey = new EllipticCurveKey(publicParameters);
  const privateKey = new EllipticCurveKey(privateParameters);

  it('should have "ES512" as its algorithm.', () => {
    expect(ES512['algorithm']).toEqual<JsonWebSignatureAlgorithm>('ES512');
  });

  it('should have "SHA512" as its "hash".', () => {
    expect(ES512['hash']).toEqual('SHA512');
  });

  it('should have "P-521" as its "curve".', () => {
    expect(ES512['curve']).toEqual<EllipticCurve>('P-521');
  });

  it('should throw when not using an "EC" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, EllipticCurveKey.prototype);

    expect(() => ES512['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "ES512" only accepts "EC" JSON Web Keys.')
    );
  });

  it('should throw when using a curve different than "P-521".', async () => {
    const key = await EllipticCurveKey.generate('EC', { curve: 'P-256' });

    expect(() => ES512['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Signature Algorithm "ES512" only accepts the Elliptic Curve "P-521".'
      )
    );
  });

  it('should throw when signing with a public key.', async () => {
    await expect(ES512.sign(message, publicKey)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    await expect(ES512.verify(Buffer.alloc(0), message, publicKey)).rejects.toThrow(
      new InvalidJsonWebSignatureException()
    );
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    await expect((async () => (signature = await ES512.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(ES512.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});
