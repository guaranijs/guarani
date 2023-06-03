import { Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Device Code Entity.
 */
export interface DeviceCode {
  /**
   * Identifier of the Device Code.
   *
   * This attribute is the **Primary Key** (or other related classification) of the Entity.
   */
  readonly id: string;

  /**
   * Shorthand identifier of the Device Code that the user will present at the Device Endpoint.
   *
   * *note: this need **not** be an actual substring of the device code.*
   */
  readonly userCode: string;

  /**
   * Verification URI that the End User must access to continue the authorization process.
   */
  readonly verificationUri: string;

  /**
   * Verification URI designed for non-textual transmission.
   *
   * This URI does not have interactions, and **MUST** contain the `user_code` needed to proceed.
   */
  readonly verificationUriComplete: Nullable<string>;

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
