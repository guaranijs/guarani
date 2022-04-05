import { UUID } from '../lib/uuid';

describe('UUID v5', () => {
  it('should create a UUID v5.', () => {
    const v5 = UUID.v5(UUID.DNS, 'somename');

    expect(v5).toBeInstanceOf(UUID);
    expect(v5.bytes.length).toBe(16);
    expect(v5.version).toBe(5);
    expect(String(v5)).toEqual('c566a11f-a32d-55f7-a7fd-01dd71cb602e');
  });
});
