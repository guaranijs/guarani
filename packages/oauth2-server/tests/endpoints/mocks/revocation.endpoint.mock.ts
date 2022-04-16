import { RevocationEndpoint } from '../../../lib/endpoints/revocation.endpoint';
import { ClientEntity } from '../../../lib/entities/client.entity';
import { Request } from '../../../lib/http/request';

export class RevocationEndpointMock extends RevocationEndpoint {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async revokeToken(_request: Request, _client: ClientEntity): Promise<void> {}
}
