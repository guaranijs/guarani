import { Asn1Encoding } from '../../types/asn1-encoding.type';

/**
 * BER ASN.1 Tag Encodings supported by Guarani.
 */
export const BerAsn1Encoding: Record<Asn1Encoding, number> = {
  /**
   * Used by simple, non-string types.
   */
  primitive: 0x00,

  /**
   * Used by structures types.
   */
  constructed: 0x20,
};
