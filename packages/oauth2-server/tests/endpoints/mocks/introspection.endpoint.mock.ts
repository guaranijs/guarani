import { IntrospectionEndpoint } from '../../../lib/endpoints/introspection.endpoint';
import { IntrospectionResponse } from '../../../lib/endpoints/types/introspection.response';
import { Client } from '../../../lib/entities/client';
import { Request } from '../../../lib/http/request';

export class IntrospectionEndpointMock extends IntrospectionEndpoint {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async introspectToken(request: Request, _client: Client): Promise<IntrospectionResponse> {
    return request.body.token === 'active' ? { active: true } : { active: false };
  }
}
