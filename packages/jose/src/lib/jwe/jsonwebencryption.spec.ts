import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../exceptions/invalid-jsonwebencryption.exception';
import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebEncryption } from './jsonwebencryption';
import { JsonWebEncryptionHeader } from './jsonwebencryption.header';

const invalidPlaintexts: any[] = [null, true, 1, 1.2, 1n, '', Symbol('a'), Buffer, () => 1, {}, []];

const invalidTokens: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidTokenFormats: string[] = ['', 'a', '.a', '.a.b.c.d', 'a.b', 'a.b.c.d.e.f'];

const invalidKeys: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(1), {}, []];

const plaintext = Buffer.from('Live long and prosper.');

const header = new JsonWebEncryptionHeader({ alg: 'A128KW', enc: 'A128CBC-HS256' });
const ek = Buffer.from('6KB707dM9YTIgHtLvtgWQ8mKwboJW3of9locizkDTHzBC2IlrT1oOQ', 'base64url');
const iv = Buffer.from('AxY8DCtDaGlsbGljb3RoZQ', 'base64url');
const ciphertext = Buffer.from('KDlTtXchhZTGufMYmOYGS4HffxPSUrfmqCHXaI9wOGY', 'base64url');
const tag = Buffer.from('U0m_YmjN04DJvceFICbCVQ', 'base64url');
const aad = Buffer.from('eyJhbGciOiJBMTI4S1ciLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0', 'ascii');

const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'GawgguFyGrWKav7AX4VKUg' });

const token =
  'eyJhbGciOiJBMTI4S1ciLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0.' +
  '6KB707dM9YTIgHtLvtgWQ8mKwboJW3of9locizkDTHzBC2IlrT1oOQ.' +
  'AxY8DCtDaGlsbGljb3RoZQ.' +
  'KDlTtXchhZTGufMYmOYGS4HffxPSUrfmqCHXaI9wOGY.' +
  'U0m_YmjN04DJvceFICbCVQ';

describe('JSON Web Encryption', () => {
  describe('constructor', () => {
    it.each(invalidPlaintexts)('should throw when the provided plaintext is invalid.', (invalidPlaintext) => {
      expect(() => new JsonWebEncryption(header, invalidPlaintext)).toThrow(
        new TypeError('Invalid JSON Web Encryption Plaintext.')
      );
    });

    it('should create an instance of a json web encryption.', () => {
      expect(new JsonWebEncryption(header)).toMatchObject({ header, plaintext: Buffer.alloc(0) });
      expect(new JsonWebEncryption(header, plaintext)).toMatchObject({ header, plaintext });
    });
  });

  describe('isJsonWebEncryption()', () => {
    it.each(invalidTokens)('should return false when the provided data is not a string.', (invalidToken) => {
      expect(JsonWebEncryption.isJsonWebEncryption(invalidToken)).toBe(false);
    });

    it.each(invalidTokenFormats)(
      'should return false when the format of the provided token is invalid.',
      (invalidToken) => {
        expect(JsonWebEncryption.isJsonWebEncryption(invalidToken)).toBe(false);
      }
    );

    it('should return true when the provided data has a valid json web encryption token format.', () => {
      expect(JsonWebEncryption.isJsonWebEncryption(token)).toBe(true);
    });
  });

  describe('decode()', () => {
    it.each(invalidTokens)('should throw when the provided token is invalid.', (invalidToken) => {
      expect(() => JsonWebEncryption.decode(invalidToken)).toThrow(new InvalidJsonWebEncryptionException());
    });

    it.each(invalidTokenFormats)('should throw when the format of the provided token is invalid.', (invalidToken) => {
      expect(() => JsonWebEncryption.decode(invalidToken)).toThrow(new InvalidJsonWebEncryptionException());
    });

    it('should throw when the header of the token is not a valid json object.', () => {
      expect(() => JsonWebEncryption.decode('a.b.c.d.e')).toThrow(InvalidJsonWebEncryptionException);
    });

    it('should decode the data of a valid token.', () => {
      expect(JsonWebEncryption.decode(token)).toMatchObject({ header, ek, iv, ciphertext, tag, aad });
    });
  });

  describe('decrypt()', () => {
    it.each(invalidKeys)('should throw when the provided json web key is invalid.', async (invalidKey) => {
      await expect(JsonWebEncryption.decrypt(token, invalidKey, [], [])).rejects.toThrow(
        new InvalidJsonWebKeyException()
      );
    });

    it('should throw when the key wrap algorithm of the token does not match the expected algorithms.', async () => {
      await expect(JsonWebEncryption.decrypt(token, wrapKey, ['ECDH-ES'], [])).rejects.toThrow(
        new InvalidJsonWebEncryptionException(
          'The JSON Web Encryption Key Wrap Algorithm "A128KW" does not match the expected algorithms.'
        )
      );
    });

    it('should throw when the key wrap algorithm of the token does not match the expected algorithms.', async () => {
      await expect(JsonWebEncryption.decrypt(token, wrapKey, ['A128KW'], ['A256GCM'])).rejects.toThrow(
        new InvalidJsonWebEncryptionException(
          'The JSON Web Encryption Content Encryption Algorithm "A128CBC-HS256" does not match the expected algorithms.'
        )
      );
    });

    it('should throw when the wrap key is not found.', async () => {
      await expect(JsonWebEncryption.decrypt(token, async () => null, ['A128KW'], ['A128CBC-HS256'])).rejects.toThrow(
        new InvalidJsonWebEncryptionException('The provided unwrap key is invalid.')
      );
    });

    it('should return the decoded json web encryption.', async () => {
      await expect(JsonWebEncryption.decrypt(token, wrapKey, ['A128KW'], ['A128CBC-HS256'])).resolves.toMatchObject({
        header,
        plaintext,
      });
    });
  });

  describe('encrypt()', () => {
    it('should throw when the wrap key is not found.', async () => {
      const jwe = new JsonWebEncryption(header, plaintext);

      await expect(jwe.encrypt(async () => null)).rejects.toThrow(
        new InvalidJsonWebEncryptionException('The provided wrap key is invalid.')
      );
    });

    it('should encode a json web encryption object into a compact token.', async () => {
      const jwe = new JsonWebEncryption(header, plaintext);

      await expect(jwe.encrypt(wrapKey)).resolves.toMatch(
        /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/
      );
    });
  });
});
