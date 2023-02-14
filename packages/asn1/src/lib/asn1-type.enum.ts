/**
 * ASN.1 Types supported by Guarani.
 */
export enum Asn1Type {
  /**
   * Boolean Type.
   */
  Boolean = 0x01,

  /**
   * Integer Type.
   */
  Integer = 0x02,

  /**
   * Bitstring Type.
   */
  BitString = 0x03,

  /**
   * Octetstring Type.
   */
  OctetString = 0x04,

  /**
   * Null Type.
   */
  Null = 0x05,

  /**
   * Object Identifier Type.
   */
  ObjectIdentifier = 0x06,

  /**
   * Sequence Type.
   */
  Sequence = 0x10,
}
