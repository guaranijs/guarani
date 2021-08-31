import { Response } from './response'

export class JsonResponse extends Response {
  public constructor(data: unknown) {
    super()

    this._headers['Content-Type'] = 'application/json'
    this._body = Buffer.from(JSON.stringify(data ?? null))
  }
}
