import { RevocationEndpoint } from '../../../lib/endpoints/revocation.endpoint';
import { Client } from '../../../lib/entities/client';
import { Request } from '../../../lib/http/request';

export class RevocationEndpointMock extends RevocationEndpoint {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async revokeToken(_request: Request, _client: Client): Promise<void> {}
}
