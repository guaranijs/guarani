export namespace PEM {
  export function encode (der: Buffer, type: string): string {
    let response = `-----BEGIN ${type}-----\n`

    const b64 = der.toString('base64')
    let i = 0

    do response += `${b64.substr(i, 64)}\n`; while ((i += 64) < b64.length)

    response += `${b64.substr(i)}`
    response += `-----END ${type}-----\n`

    return response
  }
}
