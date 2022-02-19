/**
 * Parses the provided PEM string into a Buffer object.
 *
 * @param data PEM string to be parsed.
 * @returns Parsed PEM data.
 */
export function fromPEM(data: string): Buffer {
  if (typeof data !== 'string' || data.length === 0) {
    throw new TypeError('Invalid parameter "data".');
  }

  const regex = /^-----BEGIN ([A-Z0-9\- ]+)-----\r?\n([a-zA-Z0-9+/=\r\n]+)-----END ([A-Z0-9\- ]+)-----[\r\n]?$/;
  const match = data.match(regex);

  if (match === null) {
    throw new Error('Invalid PEM encoded string.');
  }

  const [, begin, b64, end] = match;

  if (begin !== end || begin.startsWith(' ') || begin.endsWith(' ')) {
    throw new TypeError('Invalid PEM encoded string.');
  }

  const pem = b64.replace(/[\r\n]/g, '');

  return Buffer.from(pem, 'base64');
}

/**
 * Encodes the provided Buffer object into a PEM string.
 *
 * @param data Buffer object to be encoded.
 * @param label Label of the resulting PEM string.
 * @returns PEM encoded data.
 */
export function toPEM(data: Buffer, label: string): string {
  if (!Buffer.isBuffer(data) || data.length === 0) {
    throw new TypeError('Invalid parameter "label".');
  }

  if (typeof label !== 'string' || label.length === 0) {
    throw new TypeError('Invalid parameter "label".');
  }

  const b64 = data
    .toString('base64')
    .match(/.{1,64}/g)!
    .join('\n');

  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----`;
}
