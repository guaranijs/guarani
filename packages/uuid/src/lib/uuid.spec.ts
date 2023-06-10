import { Buffer } from 'buffer';

import { UUID } from './uuid';

const invalidUUIDValues: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('UUID', () => {
  describe('NIL', () => {
    it('should have "00000000-0000-0000-0000-000000000000" as its value.', () => {
      expect(UUID.NIL.toString()).toEqual('00000000-0000-0000-0000-000000000000');
    });
  });

  describe('MAX', () => {
    it('should have "ffffffff-ffff-ffff-ffff-ffffffffffff" as its value.', () => {
      expect(UUID.MAX.toString()).toEqual('ffffffff-ffff-ffff-ffff-ffffffffffff');
    });
  });

  describe('DNS_NAMESPACE', () => {
    it('should have "6ba7b810-9dad-11d1-80b4-00c04fd430c8" as its value.', () => {
      expect(UUID.DNS_NAMESPACE.toString()).toEqual('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    });
  });

  describe('URL_NAMESPACE', () => {
    it('should have "6ba7b811-9dad-11d1-80b4-00c04fd430c8" as its value.', () => {
      expect(UUID.URL_NAMESPACE.toString()).toEqual('6ba7b811-9dad-11d1-80b4-00c04fd430c8');
    });
  });

  describe('constructor', () => {
    it('should return the provided uuid object unmodified.', () => {
      const uuid = new UUID('56a840be-805c-353e-b2ab-97478df7184a');
      expect(new UUID(uuid)).toBe(uuid);
    });

    it.each(invalidUUIDValues)('should throw when providing an invalid "uuid" parameter.', (uuid) => {
      expect(() => new UUID(uuid)).toThrow(new TypeError('Invalid parameter "uuid".'));
    });

    it('should throw when providing a buffer that is not 16 bytes long.', () => {
      const uuid = Buffer.alloc(15, 0xf2);
      expect(() => new UUID(uuid)).toThrow(new TypeError('Invalid parameter "uuid".'));
    });

    it.each(['urn:uuid:', 'a0b1c2d3'])('should throw when providing an invalid uuid string.', (uuid) => {
      expect(() => new UUID(uuid)).toThrow(new TypeError('Invalid parameter "uuid".'));
    });

    it('should create a uuid from a buffer.', () => {
      expect(new UUID(Buffer.alloc(16, 0x00))).toEqual(UUID.NIL);
    });

    it('should create a uuid from a regular uuid string.', () => {
      expect(new UUID('00000000-0000-0000-0000-000000000000')).toEqual(UUID.NIL);
    });

    it('should create a uuid from a urn uuid string.', () => {
      expect(new UUID('urn:uuid:00000000-0000-0000-0000-000000000000')).toEqual(UUID.NIL);
    });
  });

  describe('v1()', () => {
    it('should return a version 1 UUID.', () => {
      const v1Pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-1[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

      const v1 = UUID.v1();

      expect(v1.version).toEqual(1);
      expect(v1.toString()).toMatch(v1Pattern);
    });
  });

  describe('v3()', () => {
    it('should return a version 3 UUID.', () => {
      const v3Pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-3[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

      const v3 = UUID.v3(UUID.URL_NAMESPACE, 'https://example.com');

      expect(v3.version).toEqual(3);
      expect(v3.toString()).toMatch(v3Pattern);
    });
  });

  describe('v4()', () => {
    it('should return a version 4 UUID.', () => {
      const v4Pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

      const v4 = UUID.v4();

      expect(v4.version).toEqual(4);
      expect(v4.toString()).toMatch(v4Pattern);
    });
  });

  describe('v5()', () => {
    it('should return a version 5 UUID.', () => {
      const v5Pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-5[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

      const v5 = UUID.v5(UUID.URL_NAMESPACE, 'https://example.com');

      expect(v5.version).toEqual(5);
      expect(v5.toString()).toMatch(v5Pattern);
    });
  });

  describe('bytes', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.bytes).toEqual(Buffer.from('123e4567e89b12d3a456426655440000', 'hex'));
    });
  });

  describe('int', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.int).toEqual(0x123e4567e89b12d3a456426655440000n);
    });
  });

  describe('hex', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.hex).toEqual('123e4567e89b12d3a456426655440000');
    });
  });

  describe('urn', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.urn).toEqual('urn:uuid:123e4567-e89b-12d3-a456-426655440000');
    });
  });

  describe('timestampLowField', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.timestampLowField).toEqual(0x123e4567n);
    });
  });

  describe('timestampMiddleField', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.timestampMiddleField).toEqual(0xe89bn);
    });
  });

  describe('timestampHighFieldAndVersion', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.timestampHighFieldAndVersion).toEqual(0x12d3n);
    });
  });

  describe('clockSequenceHighFieldAndVariant', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.clockSequenceHighFieldAndVariant).toEqual(0xa4n);
    });
  });

  describe('clockSequenceLowField', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.clockSequenceLowField).toEqual(0x56n);
    });
  });

  describe('node', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.node).toEqual(0x426655440000n);
    });
  });

  describe('timestamp', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.timestamp).toEqual(0x02d3e89b123e4567n);
    });
  });

  describe('clockSequence', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.clockSequence).toEqual(0x2456n);
    });
  });

  describe('version', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.version).toEqual(1);
    });
  });

  describe('compare()', () => {
    it('should return a negative value when the first uuid is lexicographically smaller than the second uuid.', () => {
      const first = new UUID(UUID.DNS_NAMESPACE);
      const second = new UUID(UUID.URL_NAMESPACE);

      expect(first.compare(second)).toBeNegative();
    });

    it('should return a positive value when the first uuid is lexicographically greater than the second uuid.', () => {
      const first = new UUID(UUID.URL_NAMESPACE);
      const second = new UUID(UUID.DNS_NAMESPACE);

      expect(first.compare(second)).toBePositive();
    });

    it('should return zero value when the first uuid is lexicographically equal to the second uuid.', () => {
      const first = new UUID('56a840be-805c-353e-b2ab-97478df7184a');
      const second = new UUID('56a840be-805c-353e-b2ab-97478df7184a');

      expect(first.compare(second)).toEqual(0);
    });
  });

  describe('toString()', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.toString()).toEqual('123e4567-e89b-12d3-a456-426655440000');
    });
  });

  describe('toJSON()', () => {
    it('should return the integer value of the uuid.', () => {
      const uuid = new UUID('123e4567-e89b-12d3-a456-426655440000');
      expect(uuid.toJSON()).toEqual('123e4567-e89b-12d3-a456-426655440000');
    });
  });
});
