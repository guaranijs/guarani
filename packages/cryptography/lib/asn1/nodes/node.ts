export abstract class Node {
  protected abstract value: Buffer

  public constructor () {}

  public encode (): Buffer {
    return this.value
  }

  public get length (): number {
    return this.value.length
  }
}
