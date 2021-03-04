export abstract class Node {
  public static tag: number
  protected value: Buffer

  public constructor () {}

  public encode (): Buffer {
    return this.value
  }

  public get length (): number {
    return this.value.length
  }
}
