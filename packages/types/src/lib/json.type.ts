/**
 * Describes the possible JSON values.
 */
export type Json = string | number | boolean | { [x: string]: Json } | Json[] | null;
