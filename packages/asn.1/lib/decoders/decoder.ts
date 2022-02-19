import { binaryToBuffer } from '@guarani/primitives';
import { Constructor, Dict, Optional } from '@guarani/types';

import { getInternalElements, getRootElement, getTransformer } from '../metadata/helpers';
import { BitStringNode } from '../nodes/bitstring.node';
import { BooleanNode } from '../nodes/boolean.node';
import { IntegerNode } from '../nodes/integer.node';
import { Node } from '../nodes/node';
import { NodeOptions } from '../nodes/node.options';
import { NullNode } from '../nodes/null.node';
import { ObjectIdentifierNode } from '../nodes/object-identifier.node';
import { OctetStringNode } from '../nodes/octetstring.node';
import { SequenceNode } from '../nodes/sequence.node';
import { Transformer } from '../transformer';
import { Type } from '../type';

export interface NodeOptionsWithTransformer extends NodeOptions {
  readonly transformer?: Optional<Transformer>;
}

export abstract class Decoder<TData, TModel extends object> {
  /**
   * Dictionary containing the ASN.1 Type Identifier and its respective Node.
   */
  protected readonly typeMapper: Dict<Constructor<Node>> = {
    [String(Type.BitString)]: BitStringNode,
    [String(Type.Boolean)]: BooleanNode,
    [String(Type.Integer)]: IntegerNode,
    [String(Type.Null)]: NullNode,
    [String(Type.ObjectIdentifier)]: ObjectIdentifierNode,
    [String(Type.OctetString)]: OctetStringNode,
    [String(Type.Sequence)]: SequenceNode,
  };

  /**
   * Dictionary containing the supported decoder methods.
   */
  protected readonly decoders: Dict<(options?: Optional<NodeOptionsWithTransformer>) => any> = {
    [String(Type.BitString)]: this.decodeBitString,
    [String(Type.Boolean)]: this.decodeBoolean,
    [String(Type.Bytes)]: this.decodeBytes,
    [String(Type.Integer)]: this.decodeInteger,
    [String(Type.Nested)]: this.decodeNested,
    [String(Type.Null)]: this.decodeNull,
    [String(Type.ObjectIdentifier)]: this.decodeObjectIdentifier,
    [String(Type.OctetString)]: this.decodeOctetString,
    [String(Type.Sequence)]: this.decodeSequence,
  };

  /**
   * ASN.1 Data to be decoded.
   */
  protected data: TData;

  /**
   * Model representation of the ASN.1 Structure.
   */
  protected readonly Model: Constructor<TModel>;

  /**
   * Instantiates a new ASN.1 Decoder.
   *
   * @param data ASN.1 Data to be decoded.
   * @param Model Model representation of the ASN.1 Structure.
   */
  public constructor(data: TData, Model: Constructor<TModel>) {
    this.data = data;
    this.Model = Model;
  }

  /**
   * Returns the data represented by the provided ASN.1 Tag.
   *
   * @param tag Expected ASN.1 Tag.
   * @param options Metadata of the expected format of the data section.
   */
  protected abstract getSection(tag: Type, options?: Optional<NodeOptionsWithTransformer>): TData;

  /**
   * Decodes a BitString Type.
   */
  protected abstract decodeBitString(options?: Optional<NodeOptionsWithTransformer>): string;

  /**
   * Decodes a Boolean Type.
   */
  protected abstract decodeBoolean(options?: Optional<NodeOptionsWithTransformer>): boolean;

  /**
   * Returns the first N bytes of the Decoder's data buffer based on the `length` option.
   */
  protected abstract decodeBytes(options?: Optional<NodeOptions>): Buffer;

  /**
   * Decodes an Integer Type.
   */
  protected abstract decodeInteger(options?: Optional<NodeOptionsWithTransformer>): bigint;

  /**
   * Returns the data of the Decoder unmodified.
   */
  protected abstract decodeNested(): TData;

  /**
   * Decodes a Null Type.
   */
  protected abstract decodeNull(options?: Optional<NodeOptionsWithTransformer>): null;

  /**
   * Decodes an ObjectIdentifier Type.
   */
  protected abstract decodeObjectIdentifier(options?: Optional<NodeOptionsWithTransformer>): string;

  /**
   * Decodes an OctetString Type.
   */
  protected abstract decodeOctetString(options?: Optional<NodeOptionsWithTransformer>): string;

  /**
   * Decodes a Sequence Type
   */
  protected abstract decodeSequence(options?: Optional<NodeOptions>): Decoder<TData, TModel>;

  /**
   * Decodes the data of the ASN.1 Decoder into an instance of the provided Model.
   */
  public decode(): TModel {
    let berDecoder: Decoder<TData, TModel> = this;

    const instance = Reflect.construct(this.Model, []);

    const rootElement = getRootElement(instance);
    const internalElements = getInternalElements(instance)!;

    if (rootElement.type === Type.Sequence) {
      berDecoder = this.decodeSequence(rootElement.options);
    }

    internalElements.forEach((element) => {
      const decoder = berDecoder.decoders[element.type];

      const transformer: Optional<Transformer> = getTransformer(instance, element.propertyKey);

      let value = decoder.apply(berDecoder, [{ transformer, ...element.options }]);

      if (element.Model !== undefined) {
        let nestedValue: Buffer;

        switch (element.type) {
          case Type.BitString:
            nestedValue = binaryToBuffer(value, 'be');
            break;

          case Type.OctetString:
            nestedValue = Buffer.from(value, 'hex');
            break;

          default:
            nestedValue = value;
            break;
        }

        const DecoderConstructor = <Constructor<Decoder<TData, TModel>>>this.constructor;

        const nestedDecoder = new DecoderConstructor(nestedValue, element.Model);

        value = nestedDecoder.decode();
        berDecoder.data = nestedDecoder.data;
      }

      transformer?.afterDecode.forEach((transformFunction) => (value = transformFunction(value)));

      Reflect.set(instance, element.propertyKey, value);
    });

    return instance;
  }
}
