import { UUID } from '../lib/uuid';

describe('UUID v3', () => {
  it('should create a UUID v3.', () => {
    const v3 = UUID.v3(UUID.DNS, 'somename');

    expect(v3).toBeInstanceOf(UUID);
    expect(v3.bytes.length).toBe(16);
    expect(v3.version).toBe(3);
    expect(String(v3)).toEqual('56a840be-805c-353e-b2ab-97478df7184a');
  });
});
