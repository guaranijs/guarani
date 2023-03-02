import { Buffer } from 'buffer';
import { constants } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { RsaKey } from '../../../jwk/backends/rsa/rsa.key';
import { RsaKeyParameters } from '../../../jwk/backends/rsa/rsa.key.parameters';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { RSA1_5, RSA_OAEP, RSA_OAEP_256, RSA_OAEP_384, RSA_OAEP_512 } from './rsa.backend';

const expectedContentEncryptionKey = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
  cekSize: 128,
  generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
  validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
});

const publicParameters: RsaKeyParameters = {
  kty: 'RSA',
  n:
    'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
    'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
    'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
    'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
    'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
    '5JG5iK0nsm1uZYu-02XN-w',
  e: 'AQAB',
};

const privateParameters: RsaKeyParameters = {
  ...publicParameters,
  d:
    'cc2YrWia9LGRad0SMe0PrlmeeHSyRe5-u--QJcP4uF_5LYYzXIsjDJ9_iYh0S_YY' +
    'e6bLjqHOSp44OHvJqoXMX5j3-ECKnNjnUHMtRB2awXGBqBOhB8TqoQXgmXDi1jx_' +
    '6Fu8xH-vaSfpwrsN-0QzIcYHil6b8hwE0f0r6istBmL7iayJbnONp7na9ow2fUQl' +
    'nr41vsHZa4knTZ2E2kq5ntgaXlF6AIdc4DD_BZpf2alEbhQMX9T168ZsSyAs7wKS' +
    'd3ivhHRQayXEapUfZ_ykvnF4-DoVI1iRoowgZ-dlnv4Ff3YrKQ3Zv3uHJcF1BtWQ' +
    'VipOIHx4GyIc4bmTSA5PEQ',
  p:
    '-ZFuDg38cG-e5L6h1Jbn8ngifWgHx8m1gybkY7yEpU1V02fvQAMI1XG-1WpZm2xj' +
    'j218wNCj0BCEdmdBqZMk5RlzLagtfzQ3rPO-ucYPZ_SDmy8Udzr-sZLCqMFyLtxk' +
    'gMfGo4QZ6UJWYpTCCmZ92nS_pa4ePrQdlpnS4DLv_SM',
  q:
    'y1YdZtsbYfCOdsYBZrDpcvubwMN2fKRAzETYW5sqYv8XkxHG1J1zHH-zWJBQfZhT' +
    'biHPgHvoaFykEm9xhuA77RFGRXxFUrGBtfqIx_OG-kRWudmH83EyMzMoKQaW98RX' +
    'WqRO1JDlcs4_vzf_KN63zQKv5i4UdiiObQkZCYIOVUk',
  dp:
    'vqtDX-2DjgtZY_3Y-eiJMRBjmVgfiZ4r1RWjrCddWEVrauafPVKULy6F09s6tqnq' +
    'rqvBgjZk0ROtgCCHZB0NNRNqkdlJWUP1vWdDsf8FyjBfU_J2OlmSOOydV_zjVbX_' +
    '-vumYUsN2M5b3Vk1nmiLgplryhLq_JDzghnnqG6CN-0',
  dq:
    'tKczxBhSwbcpu5i70fLH1iJ5BNAkSyTbdSCNYQYAqKee2Elo76lbhixmuP6upIdb' +
    'SHO9mZd8qov0MXTV1lEOrNc2KbH5HTkb1wRZ1dwlReDFdKUxxjYBtb9zpM93_XVx' +
    'btSgPPbnBBL-S_OCPVtyzS_f-49hGoF52KHGns3v0hE',
  qi:
    'C4q9uIi-1fYhE0NTWVNzdhSi7fA3uznTWaW1X5LWBF4gBOcWvMMTfOZEaPjtY2WP' +
    'XaTWU4bdVN0GgktVLUDPLrSj533W1cOQZb_mm_7BFNrleelruT87bZhWPYQ979kl' +
    '6590ySgbH81pEM8FQW1JBATz0MYtUNZAt8N360vayE4',
};

const publicKey = new RsaKey(publicParameters);
const privateKey = new RsaKey(privateParameters);

describe('JSON Web Encryption Key Wrap RSA1_5 Backend', () => {
  it('should have "RSA1_5" as its "algorithm".', () => {
    expect(RSA1_5['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('RSA1_5');
  });

  it('should have "crypto.constants.RSA_PKCS1_PADDING" as its "padding".', () => {
    expect(RSA1_5['padding']).toBe(constants.RSA_PKCS1_PADDING);
  });

  it('should have "undefined" as its "hash".', () => {
    expect(RSA1_5['hash']).toBeUndefined();
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RSA1_5['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "RSA1_5" only accepts "RSA" JSON Web Keys.'
      )
    );
  });

  it('should throw when not unwrapping with a private key.', async () => {
    await expect(RSA1_5.unwrap(contentEncryptionBackend, publicKey, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The provided JSON Web Key cannot be used to Unwrap a Wrapped Content Encryption Key.'
      )
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap and unwrap a content encryption key.', async () => {
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([, wrappedKey] = await RSA1_5.wrap(contentEncryptionBackend, publicKey)))()
    ).resolves.not.toThrow();

    expect(wrappedKey.byteLength).toBe(256);

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => (contentEncryptionKey = await RSA1_5.unwrap(contentEncryptionBackend, privateKey, wrappedKey)))()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA-OAEP Backend', () => {
  it('should have "RSA-OAEP" as its "algorithm".', () => {
    expect(RSA_OAEP['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('RSA-OAEP');
  });

  it('should have "crypto.constants.RSA_PKCS1_OAEP_PADDING" as its "padding".', () => {
    expect(RSA_OAEP['padding']).toBe(constants.RSA_PKCS1_OAEP_PADDING);
  });

  it('should have "SHA1" as its "hash".', () => {
    expect(RSA_OAEP['hash']).toEqual('SHA1');
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RSA_OAEP['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "RSA-OAEP" only accepts "RSA" JSON Web Keys.'
      )
    );
  });

  it('should throw when not unwrapping with a private key.', async () => {
    await expect(RSA_OAEP.unwrap(contentEncryptionBackend, publicKey, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The provided JSON Web Key cannot be used to Unwrap a Wrapped Content Encryption Key.'
      )
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap and unwrap a content encryption key.', async () => {
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([, wrappedKey] = await RSA_OAEP.wrap(contentEncryptionBackend, publicKey)))()
    ).resolves.not.toThrow();

    expect(wrappedKey.byteLength).toBe(256);

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => (contentEncryptionKey = await RSA_OAEP.unwrap(contentEncryptionBackend, privateKey, wrappedKey)))()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA-OAEP-256 Backend', () => {
  it('should have "RSA-OAEP-256" as its "algorithm".', () => {
    expect(RSA_OAEP_256['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('RSA-OAEP-256');
  });

  it('should have "crypto.constants.RSA_PKCS1_OAEP_PADDING" as its "padding".', () => {
    expect(RSA_OAEP_256['padding']).toBe(constants.RSA_PKCS1_OAEP_PADDING);
  });

  it('should have "SHA256" as its "hash".', () => {
    expect(RSA_OAEP_256['hash']).toEqual('SHA256');
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RSA_OAEP_256['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "RSA-OAEP-256" only accepts "RSA" JSON Web Keys.'
      )
    );
  });

  it('should throw when not unwrapping with a private key.', async () => {
    await expect(RSA_OAEP_256.unwrap(contentEncryptionBackend, publicKey, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The provided JSON Web Key cannot be used to Unwrap a Wrapped Content Encryption Key.'
      )
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap and unwrap a content encryption key.', async () => {
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([, wrappedKey] = await RSA_OAEP_256.wrap(contentEncryptionBackend, publicKey)))()
    ).resolves.not.toThrow();

    expect(wrappedKey.byteLength).toBe(256);

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await RSA_OAEP_256.unwrap(contentEncryptionBackend, privateKey, wrappedKey));
      })()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA-OAEP-384 Backend', () => {
  it('should have "RSA-OAEP-384" as its "algorithm".', () => {
    expect(RSA_OAEP_384['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('RSA-OAEP-384');
  });

  it('should have "crypto.constants.RSA_PKCS1_OAEP_PADDING" as its "padding".', () => {
    expect(RSA_OAEP_384['padding']).toBe(constants.RSA_PKCS1_OAEP_PADDING);
  });

  it('should have "SHA384" as its "hash".', () => {
    expect(RSA_OAEP_384['hash']).toEqual('SHA384');
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RSA_OAEP_384['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "RSA-OAEP-384" only accepts "RSA" JSON Web Keys.'
      )
    );
  });

  it('should throw when not unwrapping with a private key.', async () => {
    await expect(RSA_OAEP_384.unwrap(contentEncryptionBackend, publicKey, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The provided JSON Web Key cannot be used to Unwrap a Wrapped Content Encryption Key.'
      )
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap and unwrap a content encryption key.', async () => {
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([, wrappedKey] = await RSA_OAEP_384.wrap(contentEncryptionBackend, publicKey)))()
    ).resolves.not.toThrow();

    expect(wrappedKey.byteLength).toBe(256);

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await RSA_OAEP_384.unwrap(contentEncryptionBackend, privateKey, wrappedKey));
      })()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA-OAEP-512 Backend', () => {
  it('should have "RSA-OAEP-512" as its "algorithm".', () => {
    expect(RSA_OAEP_512['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('RSA-OAEP-512');
  });

  it('should have "crypto.constants.RSA_PKCS1_OAEP_PADDING" as its "padding".', () => {
    expect(RSA_OAEP_512['padding']).toBe(constants.RSA_PKCS1_OAEP_PADDING);
  });

  it('should have "SHA512" as its "hash".', () => {
    expect(RSA_OAEP_512['hash']).toEqual('SHA512');
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RSA_OAEP_512['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "RSA-OAEP-512" only accepts "RSA" JSON Web Keys.'
      )
    );
  });

  it('should throw when not unwrapping with a private key.', async () => {
    await expect(RSA_OAEP_512.unwrap(contentEncryptionBackend, publicKey, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The provided JSON Web Key cannot be used to Unwrap a Wrapped Content Encryption Key.'
      )
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap and unwrap a content encryption key.', async () => {
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([, wrappedKey] = await RSA_OAEP_512.wrap(contentEncryptionBackend, publicKey)))()
    ).resolves.not.toThrow();

    expect(wrappedKey.byteLength).toBe(256);

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await RSA_OAEP_512.unwrap(contentEncryptionBackend, privateKey, wrappedKey));
      })()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});
