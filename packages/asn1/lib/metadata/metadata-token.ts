/**
 * Metadata Tokens.
 */
export enum MetadataToken {
  /**
   * Metadata of the built-in property type.
   */
  DESIGN_PROP_TYPE = 'design:type',

  /**
   * Indicates that the Node Element represents the model class.
   */
  ASN1_ROOT_NODE_ELEMENT = 'asn1:root-node-element',

  /**
   * Indicates that the Node Element represents an attribute of the model class.
   */
  ASN1_INTERNAL_NODE_ELEMENTS = 'asn1:internal-node-element',

  /**
   * Indicates that the property represents an Unstructured Isolated Data.
   */
  ASN1_ISOLATED_DATA = 'asn1:isolated-data',

  /**
   * Collection of transformers to be executed after the evaluation
   * of the respective metadata.
   */
  ASN1_TRANSFORMERS = 'asn1:transformers',
}
