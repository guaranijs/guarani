import { Buffer } from 'buffer';
import { isPlainObject, removeUndefined } from './objects';

describe('removeUndefined()', () => {
  it('should remove all undefined values from an object.', () => {
    expect(
      removeUndefined({
        name: 'John Doe',
        occupation: null,
        vehicle: undefined,
        age: 23,
        address: { streetAddress: '123 1st Avenue', referencePoint: null, owner: undefined, trees: ['Oak', null] },
        hobbies: ['Jogging', undefined, { name: 'Gambling', skills: ['Poker', 'Black Jack'] }],
      })
    ).toStrictEqual({
      name: 'John Doe',
      occupation: null,
      age: 23,
      address: { streetAddress: '123 1st Avenue', referencePoint: null, trees: ['Oak', null] },
      hobbies: ['Jogging', { name: 'Gambling', skills: ['Poker', 'Black Jack'] }],
    });
  });
});

describe('isPlainObject()', () => {
  it.each([undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, []])(
    'should return false when the data is not a plain javascript object.',
    (data) => {
      expect(isPlainObject(data)).toBe(false);
    }
  );

  it.each([{}, Object.create(null)])('should return true when the data is a plain javascript object.', (data) => {
    expect(isPlainObject(data)).toBe(true);
  });
});
