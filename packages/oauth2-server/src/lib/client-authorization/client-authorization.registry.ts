import { Constructor } from '@guarani/di';

import { AuthorizationHeaderBearerClientAuthorization } from './authorization-header-bearer.client-authorization';
import { ClientAuthorizationInterface } from './client-authorization.interface';
import { ClientAuthorization } from './client-authorization.type';
import { FormEncodedBodyClientAuthorization } from './form-encoded-body.client-authorization';
import { UriQueryClientAuthorization } from './uri-query.client-authorization';

/**
 * Client Authorization Methods Registry.
 */
export const clientAuthorizationRegistry: Record<ClientAuthorization, Constructor<ClientAuthorizationInterface>> = {
  authorization_header_bearer: AuthorizationHeaderBearerClientAuthorization,
  form_encoded_body: FormEncodedBodyClientAuthorization,
  uri_query: UriQueryClientAuthorization,
};
