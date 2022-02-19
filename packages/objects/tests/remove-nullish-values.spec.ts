import { removeNullishValues } from '../lib/remove-nullish-values';

describe('removeNullishValues()', () => {
  it('should remove all nullish values from an object', () => {
    expect(
      removeNullishValues({
        name: 'John Doe',
        occupation: null,
        age: 23,
        address: { streetAddress: '123 1st Avenue', referencePoint: null, owner: undefined, trees: ['Oak', null] },
        hobbies: ['Jogging', null, { name: 'Gambling', skills: ['Poker', 'Black Jack'] }],
      })
    ).toEqual({
      name: 'John Doe',
      age: 23,
      address: { streetAddress: '123 1st Avenue', trees: ['Oak'] },
      hobbies: ['Jogging', { name: 'Gambling', skills: ['Poker', 'Black Jack'] }],
    });
  });
});
