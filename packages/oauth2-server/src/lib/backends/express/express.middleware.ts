import { Router } from 'express';

import { AuthorizationServerFactory } from '../../metadata/authorization-server.factory';
import { AuthorizationServerOptions } from '../../metadata/authorization-server.options';
import { ExpressBackend } from './express.backend';

/**
 * Enables the OAuth 2.0 Authorization Server into the Express Application.
 *
 * @param options Configuration options of the Authorization Server.
 */
export async function expressAuthorizationServer(options: AuthorizationServerOptions): Promise<Router> {
  const provider = await AuthorizationServerFactory.create(ExpressBackend, options);
  await provider.bootstrap();
  return provider.router;
}
