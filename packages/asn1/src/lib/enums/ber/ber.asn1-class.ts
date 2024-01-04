import { Asn1Class } from '../../types/asn1-class.type';

/**
 * BER ASN.1 Tag Classes supported by Guarani.
 */
export const BerAsn1Class: Record<Asn1Class, number> = {
  /**
   * The meaning of the Type is the same over all applications.
   */
  universal: 0x00,

  /**
   * The meaning of the Type is specific to the application.
   */
  application: 0x40,

  /**
   * The meaning of the Type is specific under a structured category.
   *
   * E.g.: A structured type can have the same Tag with two different meanings.
   */
  contextspecific: 0x80,

  /**
   * The meaning of the Type is specific to the enterprise.
   */
  private: 0xc0,
};
