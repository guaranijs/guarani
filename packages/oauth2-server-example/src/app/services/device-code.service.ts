import { randomInt } from 'crypto';
import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';
import { DeviceCodeServiceInterface, SETTINGS, Settings } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';

@Injectable()
export class DeviceCodeService implements DeviceCodeServiceInterface {
  public constructor(@Inject(SETTINGS) private readonly settings: Settings) {}

  public async create(scopes: string[], client: Client): Promise<DeviceCode> {
    const now = Date.now();
    const verificationUri = new URL('/device', this.settings.issuer);

    const deviceCode = DeviceCode.create({
      userCode: this.generateUserCode(),
      verificationUri: verificationUri.href,
      scopes,
      issuedAt: new Date(now),
      expiresAt: new Date(now + 300000),
      client,
    });

    await deviceCode.save();
    return deviceCode;
  }

  public async findOne(id: string): Promise<Nullable<DeviceCode>> {
    return DeviceCode.findOneBy({ id });
  }

  public async shouldSlowDown(deviceCode: DeviceCode): Promise<boolean> {
    const { lastPolled } = deviceCode;

    try {
      if (lastPolled === null) {
        return false;
      }

      return Date.now() < lastPolled.getTime() + this.settings.devicePollingInterval * 1000;
    } finally {
      deviceCode.lastPolled = new Date();
      await this.save(deviceCode);
    }
  }

  public async save(deviceCode: DeviceCode): Promise<void> {
    await deviceCode.save();
  }

  private generateUserCode(): string {
    let token = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < 8; i++) {
      token += alphabet[randomInt(alphabet.length)];
    }

    return [token.substring(0, 4), token.substring(4, 8)].join('-');
  }
}
