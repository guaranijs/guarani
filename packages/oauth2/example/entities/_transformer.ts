import { OneOrMany } from '@guarani/utils'

export const transformer = {
  from: (value: string): string[] => JSON.parse(value),
  to: (value: string[]): string => JSON.stringify(value)
}

export const audienceTransformer = {
  from: (value: string): OneOrMany<string> => JSON.parse(value),
  to: (value: OneOrMany<string>): string => {
    if (value == null) {
      return null
    }

    return JSON.stringify(value)
  }
}
