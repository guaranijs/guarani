import { Optional } from '@guarani/types';
import { UserInteractionOptions } from './user-interaction.options';

/**
 * Configuration Parameters to customize the behaviour of the Authorization Server.
 */
export interface AuthorizationServerOptions {
  /**
   * Identifier of the Authorization Server's Issuer.
   */
  readonly issuer: string;

  /**
   * Scopes registered at the Authorization Server.
   */
  readonly scopes: string[];

  /**
   * Defines the Parameters of the User Interaction.
   */
  readonly userInteraction?: Optional<UserInteractionOptions>;

  /**
   * Enables support for Refresh Token Rotation on the Authorization Server.
   */
  readonly enableRefreshTokenRotation: boolean;

  /**
   * Enables support for Access Token Revocation on the Authorization Server.
   */
  readonly enableAccessTokenRevocation: boolean;

  /**
   * Enables support for Refresh Token Introspection on the Authorization Server.
   */
  readonly enableRefreshTokenIntrospection: boolean;
}
