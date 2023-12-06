import { Buffer } from 'buffer';
import { randomInt } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { HS256, HS384, HS512 } from './hmac.backend';

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature HMAC using SHA-256 Backend', () => {
  it('should have "HS256" as its algorithm.', () => {
    expect(HS256['algorithm']).toEqual<JsonWebSignatureAlgorithm>('HS256');
  });

  it('should have "SHA256" as its "hash".', () => {
    expect(HS256['hash']).toEqual('SHA256');
  });

  it('should have 32 as its "keySize".', () => {
    expect(HS256['keySize']).toEqual(32);
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => HS256['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "HS256" only accepts "oct" JSON Web Keys.'),
    );
  });

  it('should throw when using a small secret.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: randomInt(1, 32) });

    expect(() => HS256['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The jwk parameter "k" must be at least 32 bytes.'),
    );
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const key = await OctetSequenceKey.generate('oct', { length: 32 });

    await expect((async () => (signature = await HS256.sign(message, key)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));
    expect(signature.byteLength).toEqual(32);

    await expect(HS256.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature HMAC using SHA-384 Backend', () => {
  it('should have "HS384" as its algorithm.', () => {
    expect(HS384['algorithm']).toEqual<JsonWebSignatureAlgorithm>('HS384');
  });

  it('should have "SHA384" as its "hash".', () => {
    expect(HS384['hash']).toEqual('SHA384');
  });

  it('should have 48 as its "keySize".', () => {
    expect(HS384['keySize']).toEqual(48);
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => HS384['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "HS384" only accepts "oct" JSON Web Keys.'),
    );
  });

  it('should throw when usign a small secret.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: randomInt(1, 48) });

    expect(() => HS384['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The jwk parameter "k" must be at least 48 bytes.'),
    );
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const key = await OctetSequenceKey.generate('oct', { length: 48 });

    await expect((async () => (signature = await HS384.sign(message, key)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));
    expect(signature.byteLength).toEqual(48);

    await expect(HS384.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature HMAC using SHA-512 Backend', () => {
  it('should have "HS512" as its algorithm.', () => {
    expect(HS512['algorithm']).toEqual<JsonWebSignatureAlgorithm>('HS512');
  });

  it('should have "SHA512" as its "hash".', () => {
    expect(HS512['hash']).toEqual('SHA512');
  });

  it('should have 64 as its "keySize".', () => {
    expect(HS512['keySize']).toEqual(64);
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => HS512['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "HS512" only accepts "oct" JSON Web Keys.'),
    );
  });

  it('should throw when using a small secret.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: randomInt(1, 64) });

    expect(() => HS512['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The jwk parameter "k" must be at least 64 bytes.'),
    );
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const key = await OctetSequenceKey.generate('oct', { length: 64 });

    await expect((async () => (signature = await HS512.sign(message, key)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));
    expect(signature.byteLength).toEqual(64);

    await expect(HS512.verify(signature, message, key)).resolves.not.toThrow();
  });
});
