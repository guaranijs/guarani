import { randomInt, randomUUID } from 'crypto';
import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { DeviceCode } from '../../entities/device-code.entity';
import { Logger } from '../../logger/logger';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { DeviceCodeServiceInterface } from '../device-code.service.interface';

class SampleDeviceCode extends DeviceCode {
  public waitTime!: number;
  public lastPolled!: Nullable<Date>;
}

@Injectable()
export class DeviceCodeService implements DeviceCodeServiceInterface {
  protected readonly deviceCodes: SampleDeviceCode[] = [];

  public constructor(
    protected readonly logger: Logger,
    @Inject(SETTINGS) protected readonly settings: Settings,
  ) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Device Code Service. This is only recommended for development.`,
      'c4d04336-60d3-4ba4-b000-5f021884b0fe',
    );
  }

  public async create(scopes: string[], client: Client): Promise<SampleDeviceCode> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, '0379954c-b2a6-408a-8abf-32a6016e66c0', {
      scopes,
      client,
    });

    const userCode = this.secretToken();

    const verificationUri = new URL('/device', this.settings.issuer);

    const verificationUriComplete = new URL(verificationUri.href);
    verificationUriComplete.searchParams.set('user_code', userCode);

    const now = Date.now();

    const deviceCode: SampleDeviceCode = Object.assign<SampleDeviceCode, Partial<SampleDeviceCode>>(
      Reflect.construct(SampleDeviceCode, []),
      {
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
      },
    );

    this.deviceCodes.push(deviceCode);

    return deviceCode;
  }

  public async findOne(id: string): Promise<Nullable<SampleDeviceCode>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, 'a5e58d41-204c-4140-945d-e59c58d891e3', { id });
    return this.deviceCodes.find((deviceCode) => deviceCode.id === id) ?? null;
  }

  public async shouldSlowDown(deviceCode: SampleDeviceCode): Promise<boolean> {
    this.logger.debug(`[${this.constructor.name}] Called shouldSlowDown()`, 'e5972688-993e-4d12-a930-0fe6894cf81b', {
      device_code: deviceCode,
    });

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
    this.logger.debug(`[${this.constructor.name}] Called save()`, 'b9f1661c-5a37-4fe2-9030-e624d21e399b', {
      device_code: deviceCode,
    });

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
