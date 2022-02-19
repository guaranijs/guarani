export type TransformerOperation = 'decode' | 'encode';

export interface Transformer {
  readonly transformer: (value: any) => any;
  readonly operation: TransformerOperation;
}
