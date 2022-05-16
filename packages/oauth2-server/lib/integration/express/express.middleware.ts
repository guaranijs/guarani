import { Constructor } from '@guarani/types';

import { Router } from 'express';

import { AuthorizationServerMetadata } from '../../metadata/authorization-server-metadata';
import { AuthorizationServerMetadataOptions } from '../../metadata/authorization-server-metadata.options';
import { OAuth2Factory } from '../../metadata/oauth2.factory';
import { ExpressProvider } from './express.provider';

/**
 * Enables the OAuth 2.0 Authorization Server into the Express Application.
 *
 * @param options Configuration options of the Authorization Server.
 */
export async function expressProvider(options: AuthorizationServerMetadataOptions): Promise<Router> {
  const Provider = <Constructor<ExpressProvider>>(
    Reflect.decorate([AuthorizationServerMetadata(options)], class extends ExpressProvider {})
  );

  const provider = await OAuth2Factory.create(Provider);

  provider.bootstrap();

  return provider.router;
}
