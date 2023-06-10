import { getTimeInGregorian100Nanoseconds } from './get-time-in-gregorian-100-nanoseconds';

describe('getTimeInGregorian100Nanoseconds()', () => {
  it('should return the current time as a 100-ns count since 1582-10-15T00:00:00Z', () => {
    const timeNs = getTimeInGregorian100Nanoseconds();
    const now = Date.now();

    const possibeValues = [BigInt(now + 12219292800000) * 10000n, BigInt(now + 12219292800001) * 10000n];

    expect(possibeValues.includes(timeNs)).toBeTrue();
  });
});
