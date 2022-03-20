import { InvalidJsonWebKeyException } from '../../../lib/exceptions/invalid-json-web-key.exception';
import { UnsupportedAlgorithmException } from '../../../lib/exceptions/unsupported-algorithm.exception';
import { OctKey } from '../../../lib/jwk/algorithms/oct/oct.key';
import { OctKeyParams } from '../../../lib/jwk/algorithms/oct/oct-key.params';
import {
  loadBinaryOctetSequenceKey,
  loadJwkOctetSequenceKey,
  loadStringOctetSequenceKey,
} from '../../keys/oct/load-octet-sequence-key';
import { ExportOctKeyOptions } from '../../../lib/jwk/algorithms/oct/types/export-oct-key.options';
import { ExportOctKeyEncoding } from '../../../lib/jwk/algorithms/oct/types/export-oct-key-encoding';

const invalidKtys: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('foo'), () => {}, {}, []];

const invalidSecrets: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('foo'), () => {}, {}, []];

const invalidSizes: any[] = [undefined, null, true, 1.2, 1n, 'a', Buffer.alloc(1), Symbol.for('a'), () => {}, {}, []];

describe('Octet Sequence JSON Web Key Algorithm', () => {
  describe('constructor', () => {
    it.each(invalidKtys)('should reject an invalid "kty".', (invalidKty) => {
      expect(() => new OctKey({ kty: invalidKty, k: '' })).toThrow(InvalidJsonWebKeyException);
    });

    it('should reject a JSON Web Key Type other than "oct".', () => {
      // @ts-expect-error Wrong JSON Web Key Type.
      expect(() => new OctKey({ kty: 'wrong', k: '' })).toThrow(UnsupportedAlgorithmException);
    });

    it.each(invalidSecrets)('should reject an invalid "k".', (invalidSecret) => {
      expect(() => new OctKey({ kty: 'oct', k: invalidSecret })).toThrow(InvalidJsonWebKeyException);
    });

    it('should reject an empty Secret.', () => {
      expect(() => {
        return new OctKey({ kty: 'oct', k: Buffer.alloc(0).toString('base64url') });
      }).toThrow(InvalidJsonWebKeyException);
    });
  });

  describe('generate', () => {
    it.each(invalidSizes)('should reject an invalid Secret Size.', (invalidSize) => {
      expect(OctKey.generate({ size: invalidSize })).rejects.toThrow(TypeError);
    });

    it.each([-1, 0])('should reject a zero or negative Secret Size.', (invalidSize) => {
      expect(OctKey.generate({ size: invalidSize })).rejects.toThrow(Error);
    });

    it('should generate an Octet Sequence JSON Web Key.', () => {
      expect(OctKey.generate({ size: 32 })).resolves.toMatchObject<OctKeyParams>({ kty: 'oct', k: expect.any(String) });
    });
  });

  describe('export', () => {
    const secretJson = loadJwkOctetSequenceKey();
    const secretBin = loadBinaryOctetSequenceKey();
    const secretBase64 = loadStringOctetSequenceKey();

    const keyExports: [OctKeyParams, ExportOctKeyOptions<ExportOctKeyEncoding>, string | Buffer][] = [
      [secretJson, { encoding: 'buffer' }, secretBin],
      [secretJson, { encoding: 'base64' }, secretBase64],
    ];

    const invalidExportOptions: any[] = [
      undefined,
      null,
      true,
      1,
      1.2,
      1n,
      Buffer.alloc(1),
      Symbol.for('foo'),
      () => {},
      {},
      [],
    ];

    it.each(invalidExportOptions)('should reject exporting with invalid encoding option.', (invalidEncoding) => {
      expect(() => new OctKey(secretJson).export({ encoding: invalidEncoding })).toThrow(TypeError);
    });

    it.each(keyExports)('should export an Octet Sequence JSON Web Key.', (params, options, expectedResult) => {
      // @ts-expect-error Export Options overload.
      expect(new OctKey(params).export(options)).toEqual(expectedResult);
    });
  });
});
