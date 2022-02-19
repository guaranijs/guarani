/**
 * Metadata Tokens.
 */
export enum MetadataToken {
  /**
   * Metadata of the built-in property type.
   */
  DESIGN_PROP_TYPE = 'design:type',

  /**
   * Indicates that the Element represents the model class.
   */
  ASN1_ROOT_ELEMENT = 'asn1:root-element',

  /**
   * Indicates that the Element represents an attribute of the model class.
   */
  ASN1_INTERNAL_ELEMENTS = 'asn1:internal-element',

  /**
   * Collection of transformers to be executed after the evaluation of the respective metadata.
   */
  ASN1_TRANSFORMERS = 'asn1:transformers',
}
