import { Nullable, Optional } from '@guarani/types';

/**
 * Optional attributes passed during the construction of an Edge.
 */
export interface EdgeOptions<E> {
  /**
   * Item represented by the Edge.
   */
  readonly item?: Optional<E>;

  /**
   * Weight of the Edge.
   */
  readonly weight?: Optional<number>;
}

/**
 * Implementation of an Edge of the Abstract Graph.
 */
export class Edge<V, E> {
  /**
   * Item represented by the Edge.
   */
  public item: Nullable<E>;

  /**
   * Weight of the Edge.
   */
  public weight: number;

  /**
   * Source Vertex of the Edge.
   */
  public readonly source: V;

  /**
   * Target Vertex of the Edge.
   */
  public readonly target: V;

  /**
   * Instantiates a new Edge that connects the `source` and `target` Vertices.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   * @param options Optional attributes of the Edge.
   */
  public constructor(source: V, target: V, options: Optional<EdgeOptions<E>> = {}) {
    this.source = source;
    this.target = target;
    this.item = options.item ?? null;
    this.weight = options.weight ?? 1;
  }
}
