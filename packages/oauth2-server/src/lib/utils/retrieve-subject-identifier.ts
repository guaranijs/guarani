import { Buffer } from 'buffer';
import { createDecipheriv } from 'crypto';
import { URL } from 'url';

import { Client } from '../entities/client.entity';
import { Settings } from '../settings/settings';

/**
 * Retrieves the Local Subject Identifier based on the Subject Identifier provided by the Client.
 *
 * @param sub Subject Identifier provided by the Client.
 * @param client Client of the Request.
 * @param settings Settings of the Authorization Server.
 * @returns Local Subject Identifier.
 */
export function retrieveSubjectIdentifier(sub: string, client: Client, settings: Settings): string {
  if (client.subjectType === 'public') {
    return sub;
  }

  const sectorIdentifier = new URL(client.sectorIdentifierUri!).hostname;

  const secretKey = Buffer.from(settings.secretKey, 'utf8').subarray(0, 16);
  const ciphertext = Buffer.from(sub, 'base64url');

  const decipher = createDecipheriv('aes-128-cbc', secretKey, Buffer.alloc(16, 0x00));

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return plaintext.toString('utf8').replace(sectorIdentifier, '').replace(client.pairwiseSalt!, '').replace(/=+/, '');
}
