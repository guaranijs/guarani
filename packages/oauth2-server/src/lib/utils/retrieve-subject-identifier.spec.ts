import { Client } from '../entities/client.entity';
import { Settings } from '../settings/settings';
import { retrieveSubjectIdentifier } from './retrieve-subject-identifier';

describe('retrieveSubjectIdentifier()', () => {
  it('should return the local identifier of the user.', () => {
    const sub = 'user_id';

    const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
      id: 'client_id',
      subjectType: 'public',
    });

    const settings = <Settings>{};

    expect(retrieveSubjectIdentifier(sub, client, settings)).toEqual('user_id');
  });

  it('should return the calculated sha256 digest of the identifier of the user.', () => {
    const sub =
      'RJnbyZmX5RN85M5QV9glUpYUmzyA1OAzWyNDruZDRliW0YjrJhYrHIsAeCjSCOkHQvnJkcS3ZNQ_uvYgQ0QzXhvdxbmhKhbEDoYYB8kBknM';

    const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
      id: 'client_id',
      subjectType: 'pairwise',
      sectorIdentifierUri: 'https://client.example.com/redirect_uris.json',
      pairwiseSalt: '0123456789abcdef0123456789abcdef',
    });

    const settings = <Settings>{ secretKey: '0123456789abcdef', maxLocalSubjectLength: 16 };

    expect(retrieveSubjectIdentifier(sub, client, settings)).toEqual('user_id');
  });
});
