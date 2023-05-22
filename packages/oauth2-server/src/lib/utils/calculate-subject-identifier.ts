import { Buffer } from 'buffer';
import { createCipheriv } from 'crypto';
import { URL } from 'url';

import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { Settings } from '../settings/settings';

/**
 * Calculates the Subject Identifier to be returned based on the Subject Type of the Client.
 *
 * @param user Authenticated End User.
 * @param client Client of the Request.
 * @param settings Settings of the Authorization Server.
 * @returns Public or Pairwise Subject Identifier.
 */
export function calculateSubjectIdentifier(user: User, client: Client, settings: Settings): string {
  if (client.subjectType === 'public') {
    return user.id;
  }

  const sectorIdentifier = new URL(client.sectorIdentifierUri!).hostname;
  const paddedLocalSubjectIdentifier = user.id + '='.repeat(settings.maxLocalSubjectLength! - user.id.length);

  const secretKey = Buffer.from(settings.secretKey, 'utf8').subarray(0, 16);
  const plaintext = Buffer.from(`${sectorIdentifier}${paddedLocalSubjectIdentifier}${client.pairwiseSalt!}`, 'utf8');

  const cipher = createCipheriv('aes-128-cbc', secretKey, Buffer.alloc(16, 0x00));

  return Buffer.concat([cipher.update(plaintext), cipher.final()]).toString('base64url');
}
