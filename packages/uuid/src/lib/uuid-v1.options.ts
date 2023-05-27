export interface UUIDv1Options {
  /**
   * 14-bit unsigned integer used to avoid duplicates when the clock is set backwards in time or if the node ID changes.
   */
  clockSequence?: bigint;

  /**
   * 48-bit IEEE 802 MAC address or randomly generated buffer.
   */
  node?: bigint;
}
