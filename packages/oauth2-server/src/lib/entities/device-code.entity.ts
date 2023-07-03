import { Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Device Code Entity.
 */
export interface DeviceCode {
  /**
   * Identifier of the Device Code.
   */
  readonly id: string;

  /**
   * Shorthand identifier of the Device Code that the user will present at the Device Endpoint.
   *
   * *note: this need **not** be an actual substring of the device code.*
   */
  readonly userCode: string;

  /**
   * Scopes requested by the Client.
   */
  readonly scopes: string[];

  /**
   * Authorization status of the Device Code.
   */
  isAuthorized: Nullable<boolean>;

  /**
   * Issuance Date of the Device Code.
   */
  readonly issuedAt: Date;

  /**
   * Expiration Date of the Device Code.
   */
  readonly expiresAt: Date;

  /**
   * Client requesting authorization.
   */
  readonly client: Client;

  /**
   * Authenticated User that decided on the Device Code.
   *
   * *note: once the device code is authorized, this attribute **must** be set.*
   */
  user: Nullable<User>;
}
