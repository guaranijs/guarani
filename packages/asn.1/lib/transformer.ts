export interface Transformer {
  readonly afterDecode: ((value: any) => any)[];
  readonly afterEncode: ((value: any) => any)[];
  readonly beforeDecode: (<T>(value: T) => T)[];
  readonly beforeEncode: ((value: any) => any)[];
}
