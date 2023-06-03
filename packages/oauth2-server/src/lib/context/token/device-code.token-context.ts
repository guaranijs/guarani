import { DeviceCode } from '../../entities/device-code.entity';
import { DeviceCodeTokenRequest } from '../../requests/token/device-code.token-request';
import { TokenContext } from './token-context';

/**
 * Parameters of the **Device Code** Token Context.
 */
export interface DeviceCodeTokenContext extends TokenContext<DeviceCodeTokenRequest> {
  /**
   * Device Code provided by the Client.
   */
  readonly deviceCode: DeviceCode;
}
