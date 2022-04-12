import { Dict } from '@guarani/types';

import { ClientEntity } from '../../../lib/entities/client.entity';
import { UserEntity } from '../../../lib/entities/user.entity';
import { Request } from '../../../lib/http/request';
import { SupportedResponseMode } from '../../../lib/response-modes/types/supported-response-mode';
import { ResponseType } from '../../../lib/response-types/response-type';
import { SupportedResponseType } from '../../../lib/response-types/types/supported-response-type';

export class MockResponseType extends ResponseType {
  public readonly name: SupportedResponseType = <any>'mock';

  public readonly defaultResponseMode: SupportedResponseMode = 'query';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async createAuthorizationResponse(request: Request, client: ClientEntity, user: UserEntity): Promise<Dict> {
    return {};
  }
}
