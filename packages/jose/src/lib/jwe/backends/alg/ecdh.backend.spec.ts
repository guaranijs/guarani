import { Buffer } from 'buffer';

import { EllipticCurveKey } from '../../../jwk/backends/elliptic-curve/elliptic-curve.key';
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

  it('should unwrap a content encryption key.', async () => {
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

  const expectedContentEncryptionKey = Buffer.from([...Array(16).keys()].map((value) => value));
  const expectedWrappedKey = Buffer.from('-O-0N512N8f1bIHeDte0fJLO1u2knyk2', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 128,
    generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
    validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
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

  it('should unwrap a content encryption key.', async () => {
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

  const expectedContentEncryptionKey = Buffer.from([...Array(24).keys()].map((value) => value));
  const expectedWrappedKey = Buffer.from('tIqka-8QclNYQti60WuzvQgkOoxdwEnK00c_HihpGb8', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 192,
    generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
    validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
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

  it('should unwrap a content encryption key.', async () => {
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

  const expectedContentEncryptionKey = Buffer.from([...Array(32).keys()].map((value) => value));
  const expectedWrappedKey = Buffer.from('PfCnsQGSEmV_RefJaVubN92_WG8EZ3mlqTGki9oMMyvAagyRILD9TQ', 'base64url');

  const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
    cekSize: 256,
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

  it('should unwrap a content encryption key.', async () => {
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

  const expectedContentEncryptionKey = Buffer.from([...Array(16).keys()].map((value) => value));
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

  it('should unwrap a content encryption key.', async () => {
    await expect(
      ECDH_ES_A256KW.unwrap(contentEncryptionBackend, bobKey, expectedWrappedKey, jweHeader)
    ).resolves.toEqual(expectedContentEncryptionKey);
  });
});
