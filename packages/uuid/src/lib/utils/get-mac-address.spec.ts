import { Buffer } from 'buffer';
import os from 'os';

import { getMacAddress } from './get-mac-address';

jest.mock('os');

const osMock = jest.mocked<typeof os>(jest.requireMock('os'));

describe('getMacAddress()', () => {
  it('should return null when no external adapter is found.', () => {
    const mockedNetworkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
          cidr: '127.0.0.1/8',
        },
      ],
    };

    osMock.networkInterfaces.mockReturnValueOnce(mockedNetworkInterfaces);

    expect(getMacAddress()).toBeNull();
  });

  it('should return a 6-byte buffer with the mac address of the first external adapter.', () => {
    const mockedNetworkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
          cidr: '127.0.0.1/8',
        },
      ],
      eth0: [
        {
          address: '192.168.1.108',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '01:02:03:0a:0b:0c',
          internal: false,
          cidr: '192.168.1.108/24',
        },
      ],
    };

    osMock.networkInterfaces.mockReturnValueOnce(mockedNetworkInterfaces);

    expect(getMacAddress()).toEqual(Buffer.from('0102030a0b0c', 'hex'));
  });
});
