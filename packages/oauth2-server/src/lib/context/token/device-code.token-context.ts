import { DeviceCode } from '../../entities/device-code.entity';
import { TokenContext } from './token-context';

/**
 * Parameters of the **Device Code** Token Context.
 */
export interface DeviceCodeTokenContext extends TokenContext {
  /**
   * Device Code provided by the Client.
   */
  readonly deviceCode: DeviceCode;
}
