/**
 * Encoding Methods.
 */
export enum Asn1Encoding {
  /**
   * Used by simple, non-string types.
   */
  Primitive = 0x00,

  /**
   * Used by structures types.
   */
  Constructed = 0x20,
}
