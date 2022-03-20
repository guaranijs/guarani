import { InvalidJsonWebKeyException } from '../../lib/exceptions';
import { OctKey, OctKeyParams, exportOctKey, generateOctKey, parseOctKey } from '../../lib/jwk/algorithms/oct';
import { loadSymmetricKey } from '../utils';

describe('OctKey', () => {
  const invalidSecrets: any[] = [true, 1, 1n, '', [], {}, Buffer.alloc(1)];

  it('should reject a wrong Key Type.', () => {
    expect(() => new OctKey({ kty: 'wrong', k: 'secretphrase' })).toThrow(InvalidJsonWebKeyException);
  });

  it.each(invalidSecrets)('should reject an invalid secret.', (secret) => {
    expect(() => new OctKey({ k: secret })).toThrow(InvalidJsonWebKeyException);
  });

  it('should successfully instantiate an OctKey.', () => {
    const secretKey = loadSymmetricKey<OctKeyParams>('oct', 'json');

    expect(new OctKey(secretKey)).toMatchObject({
      kty: 'oct',
      k: secretKey.k,
    });
  });
});

describe('generateOctKey()', () => {
  const invalidKeySizes: any[] = [true, '', [], {}, 1.1, 12n, Buffer.alloc(1)];

  it.each(invalidKeySizes)('should reject a non-integer key size.', (size) => {
    expect(async () => await generateOctKey(size)).rejects.toThrow(TypeError);
  });

  it.each([0, -1])('should reject negative key sizes.', (size) => {
    expect(async () => await generateOctKey(size)).rejects.toThrow();
  });

  it('should generate an OctKey.', async () => {
    const key = await generateOctKey(32);

    expect(key).toBeInstanceOf(OctKey);
    expect(key).toMatchObject({ kty: 'oct', k: expect.any(String) });
  });
});

describe('parseOctKey()', () => {
  const invalidSecrets: any[] = [true, [], {}, 1, 1n, 1.1];

  it.each(invalidSecrets)('should reject an invalid secret type.', (secret) => {
    expect(() => parseOctKey(secret)).toThrow(TypeError);
  });

  it.each(['', Buffer.alloc(0)])('should reject an empty secret.', (secret) => {
    expect(() => parseOctKey(<any>secret)).toThrow();
  });

  it('should parse a buffer secret into an OctKey.', () => {
    const json = loadSymmetricKey<OctKeyParams>('oct', 'json');
    const der = Buffer.from(loadSymmetricKey('oct', 'pem'), 'base64');

    expect(parseOctKey(der)).toMatchObject({ kty: 'oct', k: json.k });
  });

  it('should parse a string secret into an OctKey.', () => {
    const json = loadSymmetricKey<OctKeyParams>('oct', 'json');
    const pem = loadSymmetricKey('oct', 'pem');

    expect(parseOctKey(pem)).toMatchObject({ kty: 'oct', k: json.k });
  });
});

describe('exportOctKey()', () => {
  const jsonKey = loadSymmetricKey<OctKeyParams>('oct', 'json');
  const pemKey = loadSymmetricKey('oct', 'pem');
  const derKey = Buffer.from(pemKey, 'base64');
  const secretKey = new OctKey(jsonKey);

  const invalidKeys: any[] = [true, 1, 1.1, 1n, '', [], {}, Buffer.alloc(1)];

  it.each(invalidKeys)('should fail when exporting an invalid OctKey.', (key) => {
    expect(() => exportOctKey(key, 'base64')).toThrow(TypeError);
  });

  it('should fail when passing an unsupported format.', () => {
    // @ts-expect-error
    expect(() => exportOctKey(new OctKey({ k: 'foo' }), 'invalid')).toThrow();
  });

  it('should export a Base64 representation of the secret.', () => {
    expect(exportOctKey(secretKey, 'base64')).toEqual(pemKey);
  });

  it('should export a Binary representation of the secret.', () => {
    expect(exportOctKey(secretKey, 'binary')).toEqual(derKey);
  });
});
