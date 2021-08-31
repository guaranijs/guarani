import { Dict } from '@guarani/utils'

import { SupportedResponseMode } from '../constants'
import { Response } from '../context'

export interface ResponseMode {
  readonly name: SupportedResponseMode

  createResponse(redirectUri: string, data: Dict): Response
}
