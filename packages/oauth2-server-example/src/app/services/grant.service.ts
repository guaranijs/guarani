import { Injectable } from '@guarani/di';
import { AuthorizationRequest, GrantServiceInterface } from '@guarani/oauth2-server';

import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { Client } from '../entities/client.entity';
import { Grant } from '../entities/grant.entity';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class GrantService implements GrantServiceInterface {
  public async create(parameters: AuthorizationRequest, client: Client): Promise<Grant> {
    const [loginChallengeBuffer, consentChallengeBuffer] = await Promise.all([
      randomBytesAsync(16),
      randomBytesAsync(16),
    ]);

    const now = Date.now();

    const grant = Grant.create({
      loginChallenge: loginChallengeBuffer.toString('hex'),
      consentChallenge: consentChallengeBuffer.toString('hex'),
      parameters,
      createdAt: new Date(now),
      expiresAt: new Date(now + 86400000),
      client,
    });

    await grant.save();
    return grant;
  }

  public async findOne(id: string): Promise<Grant | null> {
    return await Grant.findOneBy({ id });
  }

  public async findOneByLoginChallenge(loginChallenge: string): Promise<Grant | null> {
    return await Grant.findOneBy({ loginChallenge });
  }

  public async findOneByConsentChallenge(consentChallenge: string): Promise<Grant | null> {
    return await Grant.findOneBy({ consentChallenge });
  }

  public async save(grant: Grant): Promise<void> {
    await grant.save();
  }

  public async remove(grant: Grant): Promise<void> {
    await grant.remove();
  }
}
