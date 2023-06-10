import { Buffer } from 'buffer';
import { networkInterfaces } from 'os';

import { Nullable } from '@guarani/types';

/**
 * Returns the parsed MAC Address of the first non internal network interface.
 */
export function getMacAddress(): Nullable<Buffer> {
  const interfaces = Object.values(networkInterfaces());

  for (const networkAdapters of interfaces) {
    for (const networkAdapter of networkAdapters!) {
      if (!networkAdapter.internal) {
        return Buffer.from(networkAdapter.mac.replaceAll(':', ''), 'hex');
      }
    }
  }

  return null;
}
