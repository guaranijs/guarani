import { Constructor, Dict, Optional } from '@guarani/types';

import { getInternalNodeElements, getRootNodeElement, getTransformers } from '../metadata/helpers';
import { NodeOptions } from '../nodes/node.options';
import { Type } from '../type';

type Resolvers =
  | 'decodeBitString'
  | 'decodeBoolean'
  | 'decodeBytes'
  | 'decodeInteger'
  | 'decodeNested'
  | 'decodeNull'
  | 'decodeObjectId'
  | 'decodeOctetString'
  | 'decodeSequence';

/**
 * Mapper of Type Identifiers and methods of the Decoder.
 */
const typeMapper: Dict<Resolvers> = {
  [String(Type.BitString)]: 'decodeBitString',
  [String(Type.Boolean)]: 'decodeBoolean',
  [String(Type.Bytes)]: 'decodeBytes',
  [String(Type.Integer)]: 'decodeInteger',
  [String(Type.Nested)]: 'decodeNested',
  [String(Type.Null)]: 'decodeNull',
  [String(Type.ObjectId)]: 'decodeObjectId',
  [String(Type.OctetString)]: 'decodeOctetString',
  [String(Type.Sequence)]: 'decodeSequence',
};

export abstract class Decoder<TData, TModel> {
  /**
   * Buffer to be decoded.
   */
  protected data: TData;

  /**
   * Model representation of the structure of the Buffer.
   */
  protected readonly model: Constructor<TModel>;

  /**
   * Decodes the provided Buffer into the provided structured model.
   *
   * @param data Buffer to be decoded.
   * @param model Model representation of the structure of the Buffer.
   */
  public constructor(data: TData, model: Constructor<TModel>) {
    this.data = data;
    this.model = model;
  }

  /**
   * Parses a BitString Type.
   */
  protected abstract decodeBitString(options?: Optional<NodeOptions>): Buffer;

  /**
   * Parses a Boolean Type.
   */
  protected abstract decodeBoolean(options?: Optional<NodeOptions>): boolean;

  /**
   * Returns the first N bytes of the Decoder's data buffer
   * and sets it to the remaining bytes.
   *
   * @param length Number of bytes to be displaced.
   */
  protected abstract decodeBytes(length: number): Buffer;

  /**
   * Parses an Integer Type.
   */
  protected abstract decodeInteger(options?: Optional<NodeOptions>): bigint;

  /**
   * Passes the Decoder's data buffer unmodified.
   */
  protected abstract decodeNested(): Buffer;

  /**
   * Parses a Null Type.
   */
  protected abstract decodeNull(options?: Optional<NodeOptions>): null;

  /**
   * Parses an ObjectId Type.
   */
  protected abstract decodeObjectId(options?: Optional<NodeOptions>): string;

  /**
   * Parses an OctetString Type.
   */
  protected abstract decodeOctetString(options?: Optional<NodeOptions>): Buffer;

  /**
   * Parses a Sequence Type into a new Decoder instance.
   */
  protected abstract decodeSequence(options?: Optional<NodeOptions>): Decoder<TData, TModel>;

  /**
   * Decodes the data buffer of the Decoder.
   */
  public decode(): TModel {
    let decoder: Decoder<TData, TModel> = this;

    const obj = Reflect.construct(this.model, []);

    const rootElement = getRootNodeElement(obj);

    if (rootElement?.type !== Type.Nested) {
      decoder = this.decodeSequence(rootElement.options);
    }

    const internalElements = getInternalNodeElements(obj);

    internalElements.forEach((element) => {
      const resolverName = typeMapper[String(element.type)];

      const args: any[] = [element.options];

      if (element.type === Type.Bytes) {
        args.unshift(element.bytesLength!);
      }

      let resolvedValue = (<Function>decoder[resolverName])(...args);

      const transformers = getTransformers(obj, element.propertyKey!);

      if (typeof transformers !== 'undefined') {
        transformers
          .filter(({ operation }) => operation === 'decode')
          .forEach(({ transformer }) => {
            resolvedValue = transformer(resolvedValue);
          });
      }

      if (typeof element.model !== 'undefined') {
        const nestedDecoder = new (<Constructor<Decoder<TData, TModel>>>this.constructor)(resolvedValue, element.model);

        resolvedValue = nestedDecoder.decode();
        decoder.data = nestedDecoder.data;
      }

      Reflect.set(obj, element.propertyKey!, resolvedValue);
    });

    return obj;
  }
}
