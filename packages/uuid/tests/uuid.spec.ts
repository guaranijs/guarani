import { UUID } from '../lib/uuid';

describe('UUID Constructor', () => {
  it('should create a UUID v4 when called with no arguments.', () => {
    expect(new UUID().version).toBe(4);
  });

  it('should read a UUID String.', () => {
    expect(() => new UUID('56a840be-805c-353e-b2ab-97478df7184a')).not.toThrow();

    expect(() => new UUID('urn:uuid:56a840be-805c-353e-b2ab-97478df7184a')).not.toThrow();

    expect(() => new UUID('{56a840be-805c-353e-b2ab-97478df7184a}')).not.toThrow();

    expect(() => new UUID('56a840be805c353eb2ab97478df7184a')).not.toThrow();
  });

  it('should read a UUID Buffer.', () => {
    const buf1 = Buffer.from([0xcd, 0xbc, 0xa2, 0x08]);
    const buf2 = Buffer.from([0x0a, 0x78, 0x45, 0x67]);
    const buf3 = Buffer.from([0xbc, 0xfb, 0xe9, 0x91]);
    const buf4 = Buffer.from([0xb6, 0x51, 0xe2, 0x5c]);

    const buffer = Buffer.concat([buf1, buf2, buf3, buf4]);

    expect(() => new UUID(buffer)).not.toThrow();
  });

  it('should throw when an invalid UUID is passed.', () => {
    expect(() => new UUID('abcd')).toThrow('Invalid UUID.');

    expect(() => new UUID(Buffer.from('abcd'))).toThrow('Invalid UUID.');
  });
});
