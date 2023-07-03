import { randomInt, randomUUID } from 'crypto';
import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { DeviceCode } from '../../entities/device-code.entity';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { DeviceCodeServiceInterface } from '../device-code.service.interface';

interface SampleDeviceCode extends DeviceCode {
  waitTime: number;
  lastPolled: Nullable<Date>;
}

@Injectable()
export class DeviceCodeService implements DeviceCodeServiceInterface {
  protected readonly deviceCodes: SampleDeviceCode[] = [];

  public constructor(@Inject(SETTINGS) protected readonly settings: Settings) {
    console.warn('Using default Device Code Service. This is only recommended for development.');
  }

  public async create(scopes: string[], client: Client): Promise<SampleDeviceCode> {
    const userCode = this.secretToken();

    const verificationUri = new URL('/device', this.settings.issuer);

    const verificationUriComplete = new URL(verificationUri.href);
    verificationUriComplete.searchParams.set('user_code', userCode);

    const now = Date.now();

    const deviceCode: SampleDeviceCode = {
      id: randomUUID(),
      userCode,
      scopes,
      isAuthorized: null,
      waitTime: 5,
      lastPolled: null,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 1800000),
      client,
      user: null,
    };

    this.deviceCodes.push(deviceCode);

    return deviceCode;
  }

  public async findOne(id: string): Promise<Nullable<SampleDeviceCode>> {
    return this.deviceCodes.find((deviceCode) => deviceCode.id === id) ?? null;
  }

  public async shouldSlowDown(deviceCode: SampleDeviceCode): Promise<boolean> {
    const { lastPolled, waitTime } = deviceCode;

    try {
      if (lastPolled == null) {
        return false;
      }

      return Date.now() < lastPolled.getTime() + waitTime * 1000;
    } finally {
      deviceCode.lastPolled = new Date();
      await this.save(deviceCode);
    }
  }

  public async save(deviceCode: SampleDeviceCode): Promise<void> {
    const index = this.deviceCodes.findIndex((savedDeviceCode) => savedDeviceCode.id === deviceCode.id);

    if (index > -1) {
      this.deviceCodes[index] = deviceCode;
    }
  }

  private secretToken(): string {
    let token = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < 8; i++) {
      token += alphabet[randomInt(alphabet.length)];
    }

    return token.substring(0, 4) + '-' + token.substring(4, 8);
  }
}
