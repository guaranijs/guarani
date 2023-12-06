import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { Settings } from '../settings/settings';
import { calculateSubjectIdentifier } from './calculate-subject-identifier';

describe('calculateSubjectIdentifier()', () => {
  it('should return the local identifier of the user.', () => {
    const user = <User>{ id: 'user_id' };
    const client = <Client>{ id: 'client_id', subjectType: 'public' };
    const settings = <Settings>{};

    expect(calculateSubjectIdentifier(user, client, settings)).toEqual('user_id');
  });

  it('should return the aes-128-cbc encrypted digest of the identifier of the user.', () => {
    const user = <User>{ id: 'user_id' };

    const client = <Client>{
      id: 'client_id',
      subjectType: 'pairwise',
      sectorIdentifierUri: 'https://client.example.com/redirect_uris.json',
      pairwiseSalt: '0123456789abcdef0123456789abcdef',
    };

    const settings = <Settings>{ secretKey: '0123456789abcdef', maxLocalSubjectLength: 16 };

    expect(calculateSubjectIdentifier(user, client, settings)).toEqual(
      'RJnbyZmX5RN85M5QV9glUpYUmzyA1OAzWyNDruZDRliW0YjrJhYrHIsAeCjSCOkHQvnJkcS3ZNQ_uvYgQ0QzXhvdxbmhKhbEDoYYB8kBknM',
    );
  });
});
