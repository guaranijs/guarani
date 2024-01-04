import { Asn1Type } from '../../types/asn1-type.type';

/**
 * BER ASN.1 Types supported by Guarani.
 */
export const BerAsn1Type: Record<Asn1Type, number> = {
  /**
   * Boolean Type.
   */
  boolean: 0x01,

  /**
   * Integer Type.
   */
  integer: 0x02,

  /**
   * Bitstring Type.
   */
  bitstring: 0x03,

  /**
   * Octetstring Type.
   */
  octetstring: 0x04,

  /**
   * Null Type.
   */
  null: 0x05,

  /**
   * Object Identifier Type.
   */
  objectidentifier: 0x06,

  /**
   * Sequence Type.
   */
  sequence: 0x10,
};
