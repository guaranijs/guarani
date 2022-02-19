import { byteLength } from '../lib/byte-length';

describe('Base64Url Byte Length', () => {
  it('should return the length of the Buffer of a Base64Url string.', () => {
    expect(byteLength('AQAB')).toBe(3);
  });
});
