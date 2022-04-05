import { UUID } from '../lib/uuid';

describe('UUID v4', () => {
  it('should create a UUID v4.', () => {
    const v4 = UUID.v4();

    expect(v4).toBeInstanceOf(UUID);
    expect(v4.bytes.length).toBe(16);
    expect(v4.version).toBe(4);
  });
});
