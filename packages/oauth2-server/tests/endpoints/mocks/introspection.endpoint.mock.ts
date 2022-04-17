import { IntrospectionEndpoint } from '../../../lib/endpoints/introspection.endpoint';
import { IntrospectionResponse } from '../../../lib/endpoints/types/introspection.response';
import { ClientEntity } from '../../../lib/entities/client.entity';
import { Request } from '../../../lib/http/request';

export class IntrospectionEndpointMock extends IntrospectionEndpoint {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async introspectToken(request: Request, _client: ClientEntity): Promise<IntrospectionResponse> {
    return request.body.token === 'active' ? { active: true } : { active: false };
  }
}
