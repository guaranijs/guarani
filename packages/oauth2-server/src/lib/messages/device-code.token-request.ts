import { TokenRequest } from './token-request';

/**
 * Parameters of the **Device Code** Grant Type.
 */
export interface DeviceCodeTokenRequest extends TokenRequest {
  /**
   * Device Verification Code acquired at the Device Authorization Endpoint Response.
   */
  readonly device_code: string;
}
