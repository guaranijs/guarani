export class Scope {
  public readonly name: string
  public readonly description?: string

  public constructor(name: string)
  public constructor(name: string, description: string)
  public constructor(name: string, description?: string) {
    this.name = name
    this.description = description
  }

  public toString(): string {
    return this.name
  }
}
