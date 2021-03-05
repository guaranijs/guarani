export function PEM (data: Buffer, label: string): string {
  let i = 0
  const b64 = data.toString('base64')

  let response = `-----BEGIN ${label}-----\n`

  do response += `${b64.substr(i, 64)}\n`; while ((i += 64) < b64.length)

  response += `${b64.substr(i)}`
  response += `-----END ${label}-----\n`

  return response
}
