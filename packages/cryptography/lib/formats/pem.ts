export class PEM {
  public constructor (private data: Buffer) {}

  public encode (label?: string): string {
    if (!label) throw new Error('You MUST provide a valid label.')

    let i = 0
    const b64 = this.data.toString('base64')

    let response = `-----BEGIN ${label}-----\n`

    do response += `${b64.substr(i, 64)}\n`; while ((i += 64) < b64.length)

    response += `${b64.substr(i)}`
    response += `-----END ${label}-----\n`

    return response
  }
}
