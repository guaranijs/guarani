import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { EllipticCurve } from '../../../jwk/backends/elliptic-curve.type';
import { EllipticCurveKey } from '../../../jwk/backends/elliptic-curve/elliptic-curve.key';
import { OctetKeyPairKey } from '../../../jwk/backends/octet-key-pair/octet-key-pair.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { ECDH_ES, ECDH_ES_A128KW, ECDH_ES_A192KW, ECDH_ES_A256KW } from './ecdh.backend';
import { EcdhHeaderParameters } from './ecdh.header.parameters';

const aliceKey = new EllipticCurveKey({
  kty: 'EC',
  crv: 'P-256',
  x: 'gI0GAILBdu7T53akrFmMyGcsF3n5dO7MmwNBHKW5SV0',
  y: 'SLW_xSffzlPWrHEVI30DHM_4egVwt3NQqeUD7nMFpps',
  d: '0_NxaRPUMQoAJt50Gz8YiTr8gRTwyEaCumd-MToTmIo',
});

const bobKey = new EllipticCurveKey({
  kty: 'EC',
  crv: 'P-256',
  x: 'weNJy2HscCSM6AEDTDg04biOvhFhyyWvOHQfeF_PxMQ',
  y: 'e8lnCO-AlStT-NJVX-crhB7QRYhiix03illJOVAOyck',
  d: 'VEmDZpDXXK8p8N0Cndsxs924q6nS1RXFASRl6BfUqdw',
});

describe('JSON Web Encryption Key Wrap ECDH-ES Backend', () => {
  const jweHeader: EcdhHeaderParameters = {
    alg: 'ECDH-ES',
    enc: 'A128GCM',
    apu: 'QWxpY2U',
    apv: 'Qm9i',
    epk: aliceKey.toJSON(),
  };

  const expectedContentEncryptionKey = Buffer.from('VqqN6vgjbSBcIijNcacQGg', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 128,
    generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
    validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
  });

  it('should have "ECDH-ES" as its algorithm.', () => {
    expect(ECDH_ES['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('ECDH-ES');
  });

  it('should have ["P-256", "P-384", "P-521", "X25519", "X448"] as its "curves".', () => {
    expect(ECDH_ES['curves']).toEqual<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'>[]>([
      'P-256',
      'P-384',
      'P-521',
      'X25519',
      'X448',
    ]);
  });

  it('should throw when not using either an "EC" or "OKP" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, EllipticCurveKey.prototype);

    expect(() => ECDH_ES['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES" only accepts ["EC", "OKP"] JSON Web Keys.'
      )
    );
  });

  it('should throw when using a key with an unsupported elliptic curve.', async () => {
    const key = await OctetKeyPairKey.generate('OKP', { curve: 'Ed25519' });

    expect(() => ECDH_ES['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES" only accepts the Elliptic Curves ["P-256", "P-384", "P-521", "X25519", "X448"].'
      )
    );
  });

  it('should throw when the key types do not match.', async () => {
    const wrapKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await OctetKeyPairKey.generate('OKP', { curve: 'X25519' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES',
      enc: 'A128GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    const wrapPromise = expect(ECDH_ES.wrap(contentEncryptionBackend, wrapKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    const unwrapPromise = expect(
      ECDH_ES.unwrap(contentEncryptionBackend, wrapKey, Buffer.alloc(0), header)
    ).rejects.toThrow(new InvalidJsonWebKeyException());

    await Promise.all([wrapPromise, unwrapPromise]);
  });

  it('should throw when the key curves do not match.', async () => {
    const myKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await EllipticCurveKey.generate('EC', { curve: 'P-384' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES',
      enc: 'A128GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    await expect(ECDH_ES.wrap(contentEncryptionBackend, myKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    await expect(ECDH_ES.unwrap(contentEncryptionBackend, myKey, Buffer.alloc(0), header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );
  });

  it('should wrap a content encryption key.', async () => {
    const [contentEncryptionKey, wrappedKey, header] = await ECDH_ES.wrap(contentEncryptionBackend, bobKey, jweHeader);

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey).toEqual(Buffer.alloc(0));

    expect(header).toStrictEqual<Partial<EcdhHeaderParameters>>({
      apu: jweHeader.apu,
      apv: jweHeader.apv,
      epk: aliceKey.toJSON(),
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    await expect(ECDH_ES.unwrap(contentEncryptionBackend, bobKey, Buffer.alloc(0), jweHeader)).resolves.toEqual(
      expectedContentEncryptionKey
    );
  });
});

describe('JSON Web Encryption Key Wrap ECDH-ES+A128KW Backend', () => {
  const jweHeader: EcdhHeaderParameters = {
    alg: 'ECDH-ES+A128KW',
    enc: 'A128GCM',
    apu: 'QWxpY2U',
    apv: 'Qm9i',
    epk: aliceKey.toJSON(),
  };

  const expectedContentEncryptionKey = Buffer.from([...Array(16).keys()]);
  const expectedWrappedKey = Buffer.from('-O-0N512N8f1bIHeDte0fJLO1u2knyk2', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 128,
    generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
    validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
  });

  it('should have "ECDH-ES+A128KW" as its algorithm.', () => {
    expect(ECDH_ES_A128KW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('ECDH-ES+A128KW');
  });

  it('should have ["P-256", "P-384", "P-521", "X25519", "X448"] as its "curves".', () => {
    expect(ECDH_ES_A128KW['curves']).toEqual<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'>[]>(
      ['P-256', 'P-384', 'P-521', 'X25519', 'X448']
    );
  });

  it('should throw when not using either an "EC" or "OKP" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, EllipticCurveKey.prototype);

    expect(() => ECDH_ES_A128KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES+A128KW" only accepts ["EC", "OKP"] JSON Web Keys.'
      )
    );
  });

  it('should throw when using a key with an unsupported elliptic curve.', async () => {
    const key = await OctetKeyPairKey.generate('OKP', { curve: 'Ed25519' });

    expect(() => ECDH_ES_A128KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES+A128KW" only accepts the Elliptic Curves ["P-256", "P-384", "P-521", "X25519", "X448"].'
      )
    );
  });

  it('should throw when the key types do not match.', async () => {
    const wrapKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await OctetKeyPairKey.generate('OKP', { curve: 'X25519' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES+A128KW',
      enc: 'A128GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    await expect(ECDH_ES_A128KW.wrap(contentEncryptionBackend, wrapKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    await expect(ECDH_ES_A128KW.unwrap(contentEncryptionBackend, wrapKey, Buffer.alloc(0), header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );
  });

  it('should throw when the key curves do not match.', async () => {
    const myKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await EllipticCurveKey.generate('EC', { curve: 'P-384' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES+A128KW',
      enc: 'A128GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    await expect(ECDH_ES_A128KW.wrap(contentEncryptionBackend, myKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    await expect(ECDH_ES_A128KW.unwrap(contentEncryptionBackend, myKey, Buffer.alloc(0), header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );
  });

  it('should wrap a content encryption key.', async () => {
    const [contentEncryptionKey, wrappedKey, header] = await ECDH_ES_A128KW.wrap(
      contentEncryptionBackend,
      bobKey,
      jweHeader
    );

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey).toEqual(expectedWrappedKey);

    expect(header).toStrictEqual<Partial<EcdhHeaderParameters>>({
      apu: jweHeader.apu,
      apv: jweHeader.apv,
      epk: aliceKey.toJSON(),
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    await expect(
      ECDH_ES_A128KW.unwrap(contentEncryptionBackend, bobKey, expectedWrappedKey, jweHeader)
    ).resolves.toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap ECDH-ES+A192KW Backend', () => {
  const jweHeader: EcdhHeaderParameters = {
    alg: 'ECDH-ES+A192KW',
    enc: 'A192GCM',
    apu: 'QWxpY2U',
    apv: 'Qm9i',
    epk: aliceKey.toJSON(),
  };

  const expectedContentEncryptionKey = Buffer.from([...Array(24).keys()]);
  const expectedWrappedKey = Buffer.from('tIqka-8QclNYQti60WuzvQgkOoxdwEnK00c_HihpGb8', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 192,
    generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
    validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
  });

  it('should have "ECDH-ES+A192KW" as its algorithm.', () => {
    expect(ECDH_ES_A192KW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('ECDH-ES+A192KW');
  });

  it('should have ["P-256", "P-384", "P-521", "X25519", "X448"] as its "curves".', () => {
    expect(ECDH_ES_A192KW['curves']).toEqual<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'>[]>(
      ['P-256', 'P-384', 'P-521', 'X25519', 'X448']
    );
  });

  it('should throw when not using either an "EC" or "OKP" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, EllipticCurveKey.prototype);

    expect(() => ECDH_ES_A192KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES+A192KW" only accepts ["EC", "OKP"] JSON Web Keys.'
      )
    );
  });

  it('should throw when using a key with an unsupported elliptic curve.', async () => {
    const key = await OctetKeyPairKey.generate('OKP', { curve: 'Ed25519' });

    expect(() => ECDH_ES_A192KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES+A192KW" only accepts the Elliptic Curves ["P-256", "P-384", "P-521", "X25519", "X448"].'
      )
    );
  });

  it('should throw when the key types do not match.', async () => {
    const wrapKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await OctetKeyPairKey.generate('OKP', { curve: 'X25519' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES+A192KW',
      enc: 'A192GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    await expect(ECDH_ES_A192KW.wrap(contentEncryptionBackend, wrapKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    await expect(ECDH_ES_A192KW.unwrap(contentEncryptionBackend, wrapKey, Buffer.alloc(0), header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );
  });

  it('should throw when the key curves do not match.', async () => {
    const myKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await EllipticCurveKey.generate('EC', { curve: 'P-384' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES+A192KW',
      enc: 'A192GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    await expect(ECDH_ES_A192KW.wrap(contentEncryptionBackend, myKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    await expect(ECDH_ES_A192KW.unwrap(contentEncryptionBackend, myKey, Buffer.alloc(0), header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );
  });

  it('should wrap a content encryption key.', async () => {
    const [contentEncryptionKey, wrappedKey, header] = await ECDH_ES_A192KW.wrap(
      contentEncryptionBackend,
      bobKey,
      jweHeader
    );

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey).toEqual(expectedWrappedKey);

    expect(header).toStrictEqual<Partial<EcdhHeaderParameters>>({
      apu: jweHeader.apu,
      apv: jweHeader.apv,
      epk: aliceKey.toJSON(),
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    await expect(
      ECDH_ES_A192KW.unwrap(contentEncryptionBackend, bobKey, expectedWrappedKey, jweHeader)
    ).resolves.toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap ECDH-ES+A256KW Backend', () => {
  const jweHeader: EcdhHeaderParameters = {
    alg: 'ECDH-ES+A256KW',
    enc: 'A256GCM',
    apu: 'QWxpY2U',
    apv: 'Qm9i',
    epk: aliceKey.toJSON(),
  };

  const expectedContentEncryptionKey = Buffer.from([...Array(32).keys()]);
  const expectedWrappedKey = Buffer.from('PfCnsQGSEmV_RefJaVubN92_WG8EZ3mlqTGki9oMMyvAagyRILD9TQ', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 256,
    generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
    validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
  });

  it('should have "ECDH-ES+A256KW" as its algorithm.', () => {
    expect(ECDH_ES_A256KW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('ECDH-ES+A256KW');
  });

  it('should have ["P-256", "P-384", "P-521", "X25519", "X448"] as its "curves".', () => {
    expect(ECDH_ES_A256KW['curves']).toEqual<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'>[]>(
      ['P-256', 'P-384', 'P-521', 'X25519', 'X448']
    );
  });

  it('should throw when not using either an "EC" or "OKP" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, EllipticCurveKey.prototype);

    expect(() => ECDH_ES_A256KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES+A256KW" only accepts ["EC", "OKP"] JSON Web Keys.'
      )
    );
  });

  it('should throw when using a key with an unsupported elliptic curve.', async () => {
    const key = await OctetKeyPairKey.generate('OKP', { curve: 'Ed25519' });

    expect(() => ECDH_ES_A256KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "ECDH-ES+A256KW" only accepts the Elliptic Curves ["P-256", "P-384", "P-521", "X25519", "X448"].'
      )
    );
  });

  it('should throw when the key types do not match.', async () => {
    const wrapKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await OctetKeyPairKey.generate('OKP', { curve: 'X25519' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES+A256KW',
      enc: 'A256GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    await expect(ECDH_ES_A256KW.wrap(contentEncryptionBackend, wrapKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    await expect(ECDH_ES_A256KW.unwrap(contentEncryptionBackend, wrapKey, Buffer.alloc(0), header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );
  });

  it('should throw when the key curves do not match.', async () => {
    const myKey = await EllipticCurveKey.generate('EC', { curve: 'P-256' });
    const ephemeralKey = await EllipticCurveKey.generate('EC', { curve: 'P-384' });

    const header: EcdhHeaderParameters = {
      alg: 'ECDH-ES+A256KW',
      enc: 'A256GCM',
      apu: 'QWxpY2U',
      apv: 'Qm9i',
      epk: ephemeralKey.toJSON(),
    };

    await expect(ECDH_ES_A256KW.wrap(contentEncryptionBackend, myKey, header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );

    await expect(ECDH_ES_A256KW.unwrap(contentEncryptionBackend, myKey, Buffer.alloc(0), header)).rejects.toThrow(
      new InvalidJsonWebKeyException()
    );
  });

  it('should wrap a content encryption key.', async () => {
    const [contentEncryptionKey, wrappedKey, header] = await ECDH_ES_A256KW.wrap(
      contentEncryptionBackend,
      bobKey,
      jweHeader
    );

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey).toEqual(expectedWrappedKey);

    expect(header).toStrictEqual<Partial<EcdhHeaderParameters>>({
      apu: jweHeader.apu,
      apv: jweHeader.apv,
      epk: aliceKey.toJSON(),
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    await expect(
      ECDH_ES_A256KW.unwrap(contentEncryptionBackend, bobKey, expectedWrappedKey, jweHeader)
    ).resolves.toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap ECDH-ES+A256KW Backend and JSON Web Encryption Content Encryption A128GCM Backend', () => {
  const jweHeader: EcdhHeaderParameters = {
    alg: 'ECDH-ES+A256KW',
    enc: 'A128GCM',
    apu: 'QWxpY2U',
    apv: 'Qm9i',
    epk: aliceKey.toJSON(),
  };

  const expectedContentEncryptionKey = Buffer.from([...Array(16).keys()]);
  const expectedWrappedKey = Buffer.from('jGS3GB2G8-Yy62oWb_LoCQqqRGO9PZPt', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 128,
    generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
    validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
  });

  it('should wrap a content encryption key.', async () => {
    const [contentEncryptionKey, wrappedKey, header] = await ECDH_ES_A256KW.wrap(
      contentEncryptionBackend,
      bobKey,
      jweHeader
    );

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey).toEqual(expectedWrappedKey);

    expect(header).toStrictEqual<Partial<EcdhHeaderParameters>>({
      apu: jweHeader.apu,
      apv: jweHeader.apv,
      epk: aliceKey.toJSON(),
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    await expect(
      ECDH_ES_A256KW.unwrap(contentEncryptionBackend, bobKey, expectedWrappedKey, jweHeader)
    ).resolves.toEqual(expectedContentEncryptionKey);
  });
});
