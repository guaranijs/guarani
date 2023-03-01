import { removeUndefined } from './objects';

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
